const buildAllowedOrigins = (env = process.env) => {
    const origins = String(env.CLIENT_URLS || env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);
    if (env.NODE_ENV !== 'production') {
        for (const host of ['localhost', '127.0.0.1', '[::1]']) {
            for (const port of [5173, 8081, 8082]) {
                origins.push(`http://${host}:${port}`);
            }
        }
    }
    return new Set(origins);
};
module.exports = { buildAllowedOrigins };
