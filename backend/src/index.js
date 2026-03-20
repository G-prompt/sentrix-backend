// ============================================
// SENTRIX BACKEND — Entry Point
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// ---- Health Check ----
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Sentrix Backend',
    timestamp: new Date().toISOString(),
    mode: process.env.USE_MOCK_DATA === 'true' ? 'mock' : 'live',
  });
});

// ---- Routes ----
app.use('/api/transactions', transactionRoutes);

// ---- Error Handling ----
app.use(notFound);
app.use(errorHandler);

// ---- Start ----
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   SENTRIX Backend Running            ║
  ║   Port: ${PORT}                          ║
  ║   Mode: ${process.env.USE_MOCK_DATA === 'true' ? 'MOCK DATA' : 'LIVE API  '}                    ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
