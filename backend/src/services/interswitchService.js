// ============================================
// INTERSWITCH SERVICE
// Real API calls + mock fallback
// ============================================
const axios = require('axios');
const { getAccessToken } = require('./interswitchAuth');
const config = require('../config/interswitch');
const { generateMockTransactions } = require('./mockData');
const { scoreBatch, scoreTransaction } = require('./fraudEngine');

const useMock = process.env.USE_MOCK_DATA === 'true';

// GET all transactions (mock or real)
const getTransactions = async () => {
  if (useMock) {
    console.log('[MOCK] Returning mock transactions');
    const transactions = generateMockTransactions(60);
    return scoreBatch(transactions);
  }

  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `${config.baseUrl}${config.transactionUrl}`,
      {
        params: { merchantcode: config.merchantCode },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const transactions = response.data.transactions || [];
    return scoreBatch(transactions);
  } catch (err) {
    console.error('Interswitch API error, falling back to mock:', err.message);
    return scoreBatch(generateMockTransactions(60));
  }
};

// GET single transaction by reference
const getTransactionByRef = async (transactionReference, amount) => {
  if (useMock) {
    const { generateTransaction } = require('./mockData');
    const txn = generateTransaction({ transactionReference });
    const allTxns = generateMockTransactions(20);
    return scoreTransaction(txn, allTxns);
  }

  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `${config.baseUrl}${config.transactionUrl}`,
      {
        params: {
          merchantcode: config.merchantCode,
          transactionreference: transactionReference,
          amount: amount,
        },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return scoreTransaction(response.data, []);
  } catch (err) {
    console.error('Transaction lookup failed:', err.message);
    throw new Error('Transaction not found');
  }
};

module.exports = { getTransactions, getTransactionByRef };
