// ============================================
// SENTRIX FRAUD ENGINE
// Rule-based scoring — 0 to 100
// Green: 0-30 | Amber: 31-60 | Red: 61-100
// ============================================

const THRESHOLDS = {
  GREEN: 30,
  AMBER: 60,
};

// Track transaction history in memory (replace with DB queries in production)
const transactionHistory = new Map();

const getRiskLevel = (score) => {
  if (score <= THRESHOLDS.GREEN) return 'green';
  if (score <= THRESHOLDS.AMBER) return 'amber';
  return 'red';
};

const getRiskLabel = (score) => {
  if (score <= THRESHOLDS.GREEN) return 'Safe';
  if (score <= THRESHOLDS.AMBER) return 'Watch';
  return 'Flag Immediately';
};

// ---- RULE 1: Velocity Check ----
// More than 5 transactions from same card in 10 minutes = +30
const checkVelocity = (transaction, allTransactions) => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const recentSameCard = allTransactions.filter(
    (t) =>
      t.cardLastFour === transaction.cardLastFour &&
      new Date(t.transactionDate).getTime() > tenMinutesAgo &&
      t.transactionReference !== transaction.transactionReference
  );
  if (recentSameCard.length >= 5) {
    return { score: 30, rule: 'VELOCITY_CHECK', detail: `${recentSameCard.length} transactions from same card in 10 mins` };
  }
  return null;
};

// ---- RULE 2: Amount Spike ----
// Transaction 3x above merchant average = +25
const checkAmountSpike = (transaction, allTransactions) => {
  const merchantTxns = allTransactions.filter(
    (t) =>
      t.merchantCode === transaction.merchantCode &&
      t.transactionReference !== transaction.transactionReference
  );
  if (merchantTxns.length < 3) return null;

  const avg = merchantTxns.reduce((sum, t) => sum + t.amount, 0) / merchantTxns.length;
  if (transaction.amount > avg * 3) {
    return {
      score: 25,
      rule: 'AMOUNT_SPIKE',
      detail: `Amount ₦${(transaction.amount / 100).toLocaleString()} is ${(transaction.amount / avg).toFixed(1)}x merchant average`,
    };
  }
  return null;
};

// ---- RULE 3: High Failure Rate ----
// Merchant has >30% failed transactions today = +20
const checkFailureRate = (transaction, allTransactions) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayMerchantTxns = allTransactions.filter(
    (t) =>
      t.merchantCode === transaction.merchantCode &&
      new Date(t.transactionDate) >= todayStart
  );

  if (todayMerchantTxns.length < 5) return null;

  const failed = todayMerchantTxns.filter((t) => t.responseCode !== '00');
  const failRate = failed.length / todayMerchantTxns.length;

  if (failRate > 0.3) {
    return {
      score: 20,
      rule: 'HIGH_FAILURE_RATE',
      detail: `Merchant failure rate: ${(failRate * 100).toFixed(0)}% today`,
    };
  }
  return null;
};

// ---- RULE 4: Odd Hours ----
// Transactions between 1AM - 4AM = +15
const checkOddHours = (transaction) => {
  const hour = new Date(transaction.transactionDate).getHours();
  if (hour >= 1 && hour <= 4) {
    return {
      score: 15,
      rule: 'ODD_HOURS',
      detail: `Transaction at ${hour}:00 AM (1AM-4AM window)`,
    };
  }
  return null;
};

// ---- RULE 5: Repeat Decline Retry ----
// Same card declined twice and retried immediately = +10
const checkRepeatDeclineRetry = (transaction, allTransactions) => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const recentDeclines = allTransactions.filter(
    (t) =>
      t.cardLastFour === transaction.cardLastFour &&
      t.responseCode !== '00' &&
      new Date(t.transactionDate).getTime() > fiveMinutesAgo &&
      t.transactionReference !== transaction.transactionReference
  );
  if (recentDeclines.length >= 2) {
    return {
      score: 10,
      rule: 'REPEAT_DECLINE_RETRY',
      detail: `${recentDeclines.length} declined retries from same card in 5 mins`,
    };
  }
  return null;
};

// ---- MAIN SCORING FUNCTION ----
const scoreTransaction = (transaction, allTransactions = []) => {
  const triggeredRules = [];
  let totalScore = 0;

  const rules = [
    checkVelocity(transaction, allTransactions),
    checkAmountSpike(transaction, allTransactions),
    checkFailureRate(transaction, allTransactions),
    checkOddHours(transaction),
    checkRepeatDeclineRetry(transaction, allTransactions),
  ];

  rules.forEach((result) => {
    if (result) {
      totalScore += result.score;
      triggeredRules.push(result);
    }
  });

  // Cap at 100
  totalScore = Math.min(totalScore, 100);

  return {
    ...transaction,
    riskScore: totalScore,
    riskLevel: getRiskLevel(totalScore),
    riskLabel: getRiskLabel(totalScore),
    triggeredRules,
    scoredAt: new Date().toISOString(),
  };
};

// Score a batch of transactions
const scoreBatch = (transactions) => {
  return transactions.map((txn) => scoreTransaction(txn, transactions));
};

module.exports = { scoreTransaction, scoreBatch, getRiskLevel };
