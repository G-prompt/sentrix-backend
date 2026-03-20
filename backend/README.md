# Sentrix Backend

Real-Time Chargeback Fraud Detection for Interswitch Merchants.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env`
3. Fill in your Interswitch sandbox credentials
4. `npm run dev`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/transactions | All transactions with risk scores |
| GET | /api/transactions/summary | Dashboard summary stats |
| GET | /api/transactions/flagged | Only amber + red transactions |
| GET | /api/transactions/merchants | Per-merchant risk profiles |
| GET | /api/transactions/:ref | Single transaction by reference |

## Risk Scoring

| Score | Level | Label |
|-------|-------|-------|
| 0–30 | 🟢 Green | Safe |
| 31–60 | 🟡 Amber | Watch |
| 61–100 | 🔴 Red | Flag Immediately |

## Fraud Rules

- **Velocity Check** (+30): 5+ transactions from same card in 10 mins
- **Amount Spike** (+25): 3x above merchant average
- **High Failure Rate** (+20): >30% failed transactions today
- **Odd Hours** (+15): Transactions between 1AM–4AM
- **Repeat Decline Retry** (+10): Same card declined 2+ times in 5 mins

## Demo Mode

Set `USE_MOCK_DATA=true` in `.env` to use realistic Nigerian mock data.
Fraud patterns are pre-injected into mock data for convincing demos.

## Deployment (Railway)

Push to GitHub → connect Railway → add environment variables → deploy.
