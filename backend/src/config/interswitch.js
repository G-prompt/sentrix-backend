require('dotenv').config();
module.exports = {
  clientId: process.env.INTERSWITCH_CLIENT_ID,
  clientSecret: process.env.INTERSWITCH_CLIENT_SECRET,
  baseUrl: process.env.INTERSWITCH_BASE_URL || 'https://sandbox.interswitchng.com',
  merchantCode: process.env.INTERSWITCH_MERCHANT_CODE,
  tokenUrl: '/passport/oauth/token',
  transactionUrl: '/collections/api/v1/gettransaction.json',
};
