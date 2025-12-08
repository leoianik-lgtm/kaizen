// API Key authentication middleware
function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;

    if (!validApiKey) {
        console.warn('⚠️ API_KEY not configured in environment variables');
        return res.status(500).json({ error: 'API authentication not configured' });
    }

    if (!apiKey || apiKey !== validApiKey) {
        console.warn(`❌ Invalid API key attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Invalid or missing API key' });
    }

    next();
}

// Hybrid auth: accepts either SWA user OR API key
function requireAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;

    // Check API key first
    if (apiKey && apiKey === validApiKey) {
        req.authMethod = 'api-key';
        return next();
    }

    // Check SWA authentication
    if (req.user && req.user.userId) {
        req.authMethod = 'swa-user';
        return next();
    }

    return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Provide either X-API-Key header or authenticate via Static Web App'
    });
}

module.exports = { requireApiKey, requireAuth };
