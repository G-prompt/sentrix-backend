// ============================================
// INTERSWITCH AUTH SERVICE
// Handles OAuth2 token generation + caching
// ============================================
const axios = require('axios');
const config = require('../config/interswitch');

let cachedToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString('base64');

  const response = await axios.post(
    `${config.baseUrl}${config.tokenUrl}`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  cachedToken = response.data.access_token;
  // Cache for slightly less than expiry (default 3600s)
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

  console.log('Interswitch access token refreshed');
  return cachedToken;
};

module.exports = { getAccessToken };
