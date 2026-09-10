const toInteger = (value, fallback) => {
    const parsed = Number.parseInt(String(value || ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getPagination = (query = {}, { defaultLimit = 24, maxLimit = 100 } = {}) => {
    const page = toInteger(query.page, 1);
    const limit = Math.min(toInteger(query.limit, defaultLimit), maxLimit);
    return { page, limit, skip: (page - 1) * limit };
};

const buildPaginationMeta = ({ page, limit, total }) => ({
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
});

module.exports = { getPagination, buildPaginationMeta };
