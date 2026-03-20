// ============================================
// MOCK DATA SERVICE
// Realistic Nigerian transaction data for demo
// Toggle with USE_MOCK_DATA=true in .env
// ============================================
const { v4: uuidv4 } = require('uuid');

const merchants = [
  { code: 'MX001', name: 'Lagos Spice Restaurant', category: 'Food & Dining' },
  { code: 'MX002', name: 'Abuja Grand Hotel', category: 'Hospitality' },
  { code: 'MX003', name: 'Kano Fabric Store', category: 'Retail' },
  { code: 'MX004', name: 'PH Tech Electronics', category: 'Electronics' },
  { code: 'MX005', name: 'Enugu Motors', category: 'Automotive' },
];

const generateTransaction = (overrides = {}) => {
  const merchant = merchants[Math.floor(Math.random() * merchants.length)];
  const amount = Math.floor(Math.random() * 500000) + 1000; // ₦10 - ₦5000
  const now = new Date();
  const hour = now.getHours();

  return {
    transactionReference: uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase(),
    merchantCode: merchant.code,
    merchantName: merchant.name,
    merchantCategory: merchant.category,
    amount: amount,
    currency: 'NGN',
    responseCode: Math.random() > 0.15 ? '00' : ['05', '12', '59', '61'][Math.floor(Math.random() * 4)],
    responseDescription: Math.random() > 0.15 ? 'Approved' : 'Declined',
    transactionDate: now.toISOString(),
    cardLastFour: String(Math.floor(Math.random() * 9000) + 1000),
    channel: ['WEB', 'POS', 'MOBILE', 'USSD'][Math.floor(Math.random() * 4)],
    ...overrides,
  };
};

// Generate seed of 50 transactions with some rigged fraud patterns
const generateMockTransactions = (count = 50) => {
  const transactions = [];

  for (let i = 0; i < count - 8; i++) {
    transactions.push(generateTransaction());
  }

  // Inject obvious fraud patterns for demo
  // Pattern 1: velocity - same card, multiple rapid transactions
  const fraudCard = '7823';
  for (let i = 0; i < 5; i++) {
    transactions.push(generateTransaction({
      cardLastFour: fraudCard,
      merchantCode: 'MX001',
      merchantName: 'Lagos Spice Restaurant',
      amount: 450000,
      transactionDate: new Date(Date.now() - i * 90000).toISOString(), // 90s apart
    }));
  }

  // Pattern 2: odd hours transaction
  transactions.push(generateTransaction({
    amount: 980000,
    transactionDate: new Date().setHours(2, 30, 0, 0),
    merchantCode: 'MX004',
    merchantName: 'PH Tech Electronics',
  }));

  // Pattern 3: massive amount spike
  transactions.push(generateTransaction({
    amount: 4800000,
    merchantCode: 'MX003',
    merchantName: 'Kano Fabric Store',
  }));

  return transactions.sort(() => Math.random() - 0.5);
};

module.exports = { generateMockTransactions, generateTransaction, merchants };
