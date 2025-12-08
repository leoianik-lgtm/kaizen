// Middleware para extrair usuário autenticado do header x-ms-client-principal
// Enviado automaticamente pelo Azure Static Web App

function extractUser(req, res, next) {
    const header = req.headers['x-ms-client-principal'];
    
    if (!header) {
        // Se não houver header, usuário não está autenticado
        req.user = null;
        return next();
    }

    try {
        // O header vem como Base64 JSON
        const decoded = Buffer.from(header, 'base64').toString('utf-8');
        const principal = JSON.parse(decoded);
        
        // Extrair informações úteis
        req.user = {
            userId: principal.userId || principal.userDetails,
            userDetails: principal.userDetails,
            identityProvider: principal.identityProvider,
            userRoles: principal.userRoles || []
        };
        
        console.log('✅ User authenticated:', req.user.userId);
    } catch (error) {
        console.error('❌ Error decoding x-ms-client-principal:', error);
        req.user = null;
    }
    
    next();
}

// Middleware para exigir autenticação
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Authentication required' 
        });
    }
    next();
}

module.exports = { extractUser, requireAuth };