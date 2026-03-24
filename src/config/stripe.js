// ─────────────────────────────────────────────────────────────
//  config/stripe.js — Instance Stripe SDK v14
// ─────────────────────────────────────────────────────────────
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY non définie — paiements désactivés');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10'
});

module.exports = stripe;
