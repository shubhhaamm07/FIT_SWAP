const prisma = require('../lib/prisma');

const MAX_RESULTS = 200;
const MAX_SCAN = 500;

const normaliseSearch = (value) => String(value || '').trim().slice(0, 120);
const normaliseAction = (value) => /^[A-Z_]{3,80}$/.test(String(value || '')) ? String(value) : undefined;

const getOwnerScope = async (ownerId) => {
    const [memberships, listings, plans] = await Promise.all([
        prisma.userMembership.findMany({
            where: { plan: { gym: { ownerId } } },
            select: { id: true },
        }),
        prisma.marketplaceListing.findMany({
            where: { membership: { plan: { gym: { ownerId } } } },
            select: { id: true },
        }),
        prisma.membershipPlan.findMany({
            where: { gym: { ownerId } },
            select: { id: true },
        }),
    ]);

    return {
        membershipIds: memberships.map((item) => item.id),
        listingIds: listings.map((item) => item.id),
        policyIds: plans.map((item) => `plan:${item.id}`),
    };
};

const buildAuditWhere = ({ action, search, scope }) => {
    const where = {};
    const cleanAction = normaliseAction(action);
    const cleanSearch = normaliseSearch(search);

    if (cleanAction) where.action = cleanAction;
    if (scope) {
        const membershipIds = [...scope.membershipIds, ...scope.policyIds];
        if (!membershipIds.length && !scope.listingIds.length) return null;
        where.OR = [
            membershipIds.length ? { membershipId: { in: membershipIds } } : undefined,
            scope.listingIds.length ? { listingId: { in: scope.listingIds } } : undefined,
        ].filter(Boolean);
    }
    if (cleanSearch) {
        const searchFilter = {
            OR: [
                { summary: { contains: cleanSearch, mode: 'insensitive' } },
                { action: { contains: cleanSearch, mode: 'insensitive' } },
                { actorId: { contains: cleanSearch, mode: 'insensitive' } },
            ],
        };
        if (where.OR) where.AND = [{ OR: where.OR }, searchFilter], delete where.OR;
        else Object.assign(where, searchFilter);
    }
    return where;
};

const enrichAuditLogs = async (logs) => {
    const actorIds = [...new Set(logs.map((log) => log.actorId).filter(Boolean))];
    const actors = actorIds.length
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
        })
        : [];
    const actorById = new Map(actors.map((actor) => [actor.id, actor]));
    return logs.map((log) => ({ ...log, actor: log.actorId ? actorById.get(log.actorId) || null : null }));
};

const getTransferAuditLogs = async ({ action, search, ownerId } = {}) => {
    const scope = ownerId ? await getOwnerScope(ownerId) : null;
    const where = buildAuditWhere({ action, search, scope });
    if (where === null) return [];
    const logs = await prisma.transferAuditLog.findMany({
        where,
        take: MAX_RESULTS,
        orderBy: { createdAt: 'desc' },
    });
    return enrichAuditLogs(logs);
};

const makeAlert = (alert) => ({
    id: `${alert.type}:${alert.entityType}:${alert.entityId}`,
    createdAt: alert.createdAt || new Date(),
    ...alert,
});

const getFraudAlerts = async ({ ownerId } = {}) => {
    const scope = ownerId ? await getOwnerScope(ownerId) : null;
    const listingWhere = ownerId
        ? { deletedAt: null, membership: { plan: { gym: { ownerId } } } }
        : { deletedAt: null };
    const listingIds = scope?.listingIds || undefined;
    const requestWhere = listingIds ? { listingId: { in: listingIds } } : {};
    const paymentWhere = listingIds ? { listingId: { in: listingIds } } : {};

    const [listings, transferRequests, upiRequests, failedPayments] = await Promise.all([
        prisma.marketplaceListing.findMany({
            where: { ...listingWhere, status: 'ACTIVE' },
            take: MAX_SCAN,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, askingPrice: true, createdAt: true,
                seller: { select: { id: true, firstName: true, lastName: true, email: true } },
                membership: { select: { plan: { select: { price: true, name: true, gym: { select: { name: true } } } } } },
            },
        }),
        prisma.transferRequest.findMany({
            where: requestWhere,
            take: MAX_SCAN,
            orderBy: { createdAt: 'desc' },
            select: { id: true, buyerId: true, listingId: true, status: true, createdAt: true },
        }),
        prisma.upiPaymentRequest.findMany({
            where: paymentWhere,
            take: MAX_SCAN,
            orderBy: { createdAt: 'desc' },
            select: { id: true, buyerId: true, listingId: true, status: true, createdAt: true, utr: true },
        }),
        prisma.payment.findMany({
            where: { ...paymentWhere, status: 'FAILED' },
            take: MAX_SCAN,
            orderBy: { createdAt: 'desc' },
            select: { id: true, buyerId: true, listingId: true, createdAt: true },
        }),
    ]);

    const alerts = [];
    listings.forEach((listing) => {
        const originalPrice = Number(listing.membership.plan.price || 0);
        const ratio = originalPrice ? Number(listing.askingPrice) / originalPrice : 1;
        if (ratio <= 0.35) {
            alerts.push(makeAlert({
                type: 'UNUSUALLY_LOW_PRICE', severity: ratio <= 0.31 ? 'HIGH' : 'MEDIUM', entityType: 'LISTING', entityId: listing.id,
                title: 'Listing is priced close to the minimum allowed value',
                description: `${listing.membership.plan.name} at ${listing.membership.plan.gym.name} is listed at ${Math.round(ratio * 100)}% of the original plan price.`,
                actor: listing.seller, createdAt: listing.createdAt,
            }));
        }
    });

    const byBuyer = new Map();
    const recordBuyerEvent = (event, kind) => {
        if (!event.buyerId) return;
        const current = byBuyer.get(event.buyerId) || { cancellations: 0, failedPayments: 0, recentRequests: 0, latestAt: event.createdAt };
        if (['CANCELLED', 'REJECTED', 'EXPIRED'].includes(event.status)) current.cancellations += 1;
        if (kind === 'PAYMENT_FAILURE') current.failedPayments += 1;
        current.recentRequests += 1;
        if (new Date(event.createdAt) > new Date(current.latestAt)) current.latestAt = event.createdAt;
        byBuyer.set(event.buyerId, current);
    };
    transferRequests.forEach((request) => recordBuyerEvent(request, 'TRANSFER'));
    upiRequests.forEach((request) => recordBuyerEvent(request, 'PAYMENT'));
    failedPayments.forEach((payment) => recordBuyerEvent({ ...payment, status: 'FAILED' }, 'PAYMENT_FAILURE'));

    const buyerIds = [...byBuyer.keys()];
    const buyers = buyerIds.length ? await prisma.user.findMany({
        where: { id: { in: buyerIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
    }) : [];
    const buyerById = new Map(buyers.map((buyer) => [buyer.id, buyer]));
    byBuyer.forEach((summary, buyerId) => {
        if (summary.cancellations >= 3) {
            alerts.push(makeAlert({ type: 'REPEATED_CANCEL_OR_REJECT', severity: 'HIGH', entityType: 'USER', entityId: buyerId, title: 'Repeated cancelled or rejected transfer attempts', description: `${summary.cancellations} unsuccessful transfer or payment attempts were recorded in the current review window.`, actor: buyerById.get(buyerId) || null, createdAt: summary.latestAt }));
        }
        if (summary.failedPayments >= 2) {
            alerts.push(makeAlert({ type: 'FREQUENT_FAILED_PAYMENTS', severity: 'HIGH', entityType: 'USER', entityId: buyerId, title: 'Frequent failed payment attempts', description: `${summary.failedPayments} failed online payment attempts require review.`, actor: buyerById.get(buyerId) || null, createdAt: summary.latestAt }));
        }
        if (summary.recentRequests >= 5) {
            alerts.push(makeAlert({ type: 'RAPID_TRANSFER_ACTIVITY', severity: 'MEDIUM', entityType: 'USER', entityId: buyerId, title: 'High volume of transfer activity', description: `${summary.recentRequests} transfer/payment requests were created in the current review window.`, actor: buyerById.get(buyerId) || null, createdAt: summary.latestAt }));
        }
    });

    return alerts.sort((first, second) => {
        const severity = { HIGH: 2, MEDIUM: 1, LOW: 0 };
        return severity[second.severity] - severity[first.severity] || new Date(second.createdAt) - new Date(first.createdAt);
    }).slice(0, MAX_RESULTS);
};

module.exports = { getTransferAuditLogs, getFraudAlerts };
