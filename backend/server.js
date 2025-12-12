const express = require('express');
const cors = require('cors');
const { extractUser } = require('./src/auth');
const kaizensRouter = require('./src/routes/kaizens');
const attachmentsRouter = require('./src/routes/attachments');
const { dbReady } = require('./src/db');

const app = express();
const port = process.env.PORT || 8080;

// Middlewares
const corsOptions = {
    origin: [
        'https://agreeable-mushroom-003d5f703.3.azurestaticapps.net',
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-ms-client-principal', 'X-API-Key']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(extractUser); // Extrair usuário do header x-ms-client-principal

// Log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Kaizen API is running',
        timestamp: new Date().toISOString(),
        user: req.user ? req.user.userId : 'not authenticated'
    });
});

// Rotas da API
app.use('/api/kaizens', kaizensRouter);
app.use('/api/attachments', attachmentsRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server after DB is ready
dbReady.then(() => {
    app.listen(port, () => {
        console.log(`✅ Kaizen API listening on port ${port}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📁 Database path: ${process.env.DB_PATH || 'default'}`);
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
});