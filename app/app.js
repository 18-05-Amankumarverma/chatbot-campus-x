const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const chatRoutes = require('./routes/chat.routes');
const { logger } = require('./utils/logger');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false }));
app.use(express.json({ limit: '32kb' }));
app.use(logger);
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/chat', chatRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
