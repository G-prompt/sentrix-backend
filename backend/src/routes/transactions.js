// ============================================
// TRANSACTIONS ROUTES
// ============================================
const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionByRef } = require('../services/interswitchService');
const { scoreBatch } = require('../services/fraudEngine');

// GET /api/transactions
// Returns all transactions with risk scores
router.get('/', async (req, res, next) => {
  try {
    const transactions = await getTransactions();
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/flagged
// Returns only amber + red transactions
router.get('/flagged', async (req, res, next) => {
  try {
    const transactions = await getTransactions();
    const flagged = transactions.filter((t) => t.riskLevel !== 'green');
    const sorted = flagged.sort((a, b) => b.riskScore - a.riskScore);
    res.json({ success: true, count: sorted.length, data: sorted });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/summary
// Dashboard summary stats
router.get('/summary', async (req, res, next) => {
  try {
    const transactions = await getTransactions();
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const flaggedCount = transactions.filter((t) => t.riskLevel !== 'green').length;
    const redCount = transactions.filter((t) => t.riskLevel === 'red').length;
    const amberCount = transactions.filter((t) => t.riskLevel === 'amber').length;
    const greenCount = transactions.filter((t) => t.riskLevel === 'green').length;

    res.json({
      success: true,
      data: {
        totalTransactions: transactions.length,
        totalVolume,
        flaggedCount,
        redCount,
        amberCount,
        greenCount,
        flaggedPercentage: ((flaggedCount / transactions.length) * 100).toFixed(1),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/merchants
// Per-merchant risk profile
router.get('/merchants', async (req, res, next) => {
  try {
    const transactions = await getTransactions();
    const merchantMap = {};

    transactions.forEach((t) => {
      if (!merchantMap[t.merchantCode]) {
        merchantMap[t.merchantCode] = {
          merchantCode: t.merchantCode,
          merchantName: t.merchantName,
          totalTransactions: 0,
          totalVolume: 0,
          flaggedCount: 0,
          avgRiskScore: 0,
          riskScores: [],
        };
      }
      const m = merchantMap[t.merchantCode];
      m.totalTransactions++;
      m.totalVolume += t.amount;
      m.riskScores.push(t.riskScore);
      if (t.riskLevel !== 'green') m.flaggedCount++;
    });

    // Calculate averages
    const merchants = Object.values(merchantMap).map((m) => ({
      ...m,
      avgRiskScore: Math.round(m.riskScores.reduce((a, b) => a + b, 0) / m.riskScores.length),
      riskScores: undefined,
    }));

    res.json({ success: true, count: merchants.length, data: merchants });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/:ref
// Single transaction lookup
router.get('/:ref', async (req, res, next) => {
  try {
    const { ref } = req.params;
    const { amount } = req.query;
    const transaction = await getTransactionByRef(ref, amount);
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
