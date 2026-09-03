const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toAmount = (value, fallback = 0) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : fallback;
};

const clamp = (value, minimum, maximum) => Math.min(
    Math.max(value, minimum),
    maximum
);

const roundToNearestFifty = (value) => Math.round(value / 50) * 50;

const getRemainingDays = (endDate, now) => Math.max(
    0,
    Math.ceil((new Date(endDate).getTime() - now.getTime()) / DAY_IN_MS)
);

const median = (values) => {
    if (!values.length) return null;

    const ordered = [...values].sort((first, second) => first - second);
    const middle = Math.floor(ordered.length / 2);

    return ordered.length % 2
        ? ordered[middle]
        : (ordered[middle - 1] + ordered[middle]) / 2;
};

const getBaselineMultiplier = (remainingRatio) => {
    if (remainingRatio >= 0.75) return 0.88;
    if (remainingRatio >= 0.45) return 0.84;
    return 0.78;
};

const getComparableMultiplier = (listing, now) => {
    const plan = listing.membership?.plan;
    if (!plan) return null;

    const planPrice = toAmount(plan.price);
    const durationInDays = Math.max(1, toAmount(plan.durationInDays, 1));
    const daysRemaining = getRemainingDays(listing.membership.endDate, now);
    const remainingValue = planPrice * clamp(daysRemaining / durationInDays, 0, 1);
    const multiplier = remainingValue > 0
        ? toAmount(listing.askingPrice) / remainingValue
        : null;

    // Ignore malformed or extreme prices so one unusual listing cannot distort
    // the recommendation for every seller at a gym.
    return multiplier && multiplier >= 0.3 && multiplier <= 1.2
        ? multiplier
        : null;
};

const getComparableStats = (comparables) => {
    if (!comparables.length) return null;

    const prices = comparables.map((listing) => toAmount(listing.askingPrice));
    const total = prices.reduce((sum, price) => sum + price, 0);

    return {
        count: prices.length,
        averagePrice: Math.round(total / prices.length),
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices)
    };
};

const getConfidence = (comparableCount) => {
    if (comparableCount >= 4) return 'HIGH';
    if (comparableCount >= 1) return 'MEDIUM';
    return 'LOW';
};

const buildFairPriceSuggestion = ({ membership, comparableListings = [], now = new Date() }) => {
    const plan = membership.plan;
    const planPrice = toAmount(plan.price);
    const purchasePrice = toAmount(membership.purchasePrice, planPrice);
    const durationInDays = Math.max(1, toAmount(plan.durationInDays, 1));
    const daysRemaining = getRemainingDays(membership.endDate, now);
    const remainingRatio = clamp(daysRemaining / durationInDays, 0, 1);
    const unusedValue = purchasePrice * remainingRatio;
    const transferFee = toAmount(plan.transferFee);
    const minimumListingPrice = Math.ceil(planPrice * 0.3);
    const comparableMultipliers = comparableListings
        .map((listing) => getComparableMultiplier(listing, now))
        .filter((multiplier) => multiplier !== null);
    const baselineMultiplier = getBaselineMultiplier(remainingRatio);
    const marketMultiplier = median(comparableMultipliers);
    const blendedMultiplier = marketMultiplier === null
        ? baselineMultiplier
        : (baselineMultiplier * 0.65) + (marketMultiplier * 0.35);
    const transferFeeAdjustment = Math.min(transferFee * 0.35, unusedValue * 0.08);
    const unboundedSuggestion = (unusedValue * blendedMultiplier) - transferFeeAdjustment;
    const suggestedPrice = roundToNearestFifty(clamp(
        unboundedSuggestion,
        minimumListingPrice,
        planPrice
    ));
    const suggestedRange = {
        minimum: roundToNearestFifty(clamp(
            suggestedPrice * 0.9,
            minimumListingPrice,
            planPrice
        )),
        maximum: roundToNearestFifty(clamp(
            suggestedPrice * 1.08,
            minimumListingPrice,
            planPrice
        ))
    };
    const comparableStats = getComparableStats(comparableListings);
    const reasons = [
        `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remain from this ${durationInDays}-day plan.`,
        `The unused membership value is estimated at ₹${Math.round(unusedValue).toLocaleString('en-IN')}.`
    ];

    if (transferFee > 0) {
        reasons.push(`The ₹${Math.round(transferFee).toLocaleString('en-IN')} transfer fee is considered so the buyer's total stays competitive.`);
    }

    if (comparableStats) {
        reasons.push(`Based on ${comparableStats.count} active listing${comparableStats.count === 1 ? '' : 's'} at the same gym.`);
    } else {
        reasons.push('No comparable active listings were available, so this uses membership value and marketplace rules.');
    }

    if (suggestedPrice === minimumListingPrice && unboundedSuggestion < minimumListingPrice) {
        reasons.push('The marketplace minimum price has been applied.');
    }

    return {
        model: 'rules-based-v1',
        suggestedPrice,
        suggestedRange,
        confidence: getConfidence(comparableMultipliers.length),
        daysRemaining,
        planPrice,
        purchasePrice,
        estimatedUnusedValue: Math.round(unusedValue),
        transferFee,
        marketplaceLimits: {
            minimum: minimumListingPrice,
            maximum: planPrice
        },
        comparableStats,
        reasons
    };
};

module.exports = { buildFairPriceSuggestion };
