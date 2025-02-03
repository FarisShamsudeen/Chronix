const paypal = require('@paypal/checkout-server-sdk');

// Load environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;

const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret); // Use LiveEnvironment for production
const client = new paypal.core.PayPalHttpClient(environment);

module.exports = { client };
