// ─────────────────────────────────────────────────────────────
//  services/webhook.service.js — Stripe webhook handler logic
//  RÈGLE-08 : distinguer metadata.type subscription vs purchase
// ─────────────────────────────────────────────────────────────
const User        = require('../models/User.model');
const Purchase    = require('../models/Purchase.model');
const Transaction = require('../models/Transaction.model');

exports.handlePaymentSucceeded = async (paymentIntent) => {
  const { metadata, id: stripePaymentId, amount } = paymentIntent;

  if (metadata.type === 'subscription') {
    const premiumExpiry = new Date(
      Date.now() + (metadata.plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
    );
    await User.findByIdAndUpdate(metadata.userId, {
      isPremium: true, role: 'premium', premiumExpiry
    });
    await Transaction.findOneAndUpdate(
      { stripePaymentId },
      { userId: metadata.userId, type: 'subscription', stripePaymentId,
        amount, plan: metadata.plan, status: 'succeeded' },
      { upsert: true, new: true }
    );
  } else if (metadata.type === 'purchase') {
    // RÈGLE-09 : idempotence
    await Purchase.findOneAndUpdate(
      { userId: metadata.userId, contentId: metadata.contentId },
      { userId: metadata.userId, contentId: metadata.contentId,
        stripePaymentId, amount, purchasedAt: new Date() },
      { upsert: true, new: true }
    );
    await Transaction.findOneAndUpdate(
      { stripePaymentId },
      { userId: metadata.userId, type: 'purchase', stripePaymentId,
        amount, contentId: metadata.contentId, status: 'succeeded' },
      { upsert: true, new: true }
    );
  }
};
