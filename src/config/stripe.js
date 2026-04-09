// ─────────────────────────────────────────────────────────────
//  config/stripe.js — Instance Stripe SDK v14
// ─────────────────────────────────────────────────────────────
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY non définie — paiements désactivés');
}

const config = { apiVersion: '2024-04-10' };

if (process.env.USE_MOCK_STRIPE === 'true') {
  config.host     = 'localhost';
  config.port     = 3002;
  config.protocol = 'http';
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', config);

module.exports = stripe;
