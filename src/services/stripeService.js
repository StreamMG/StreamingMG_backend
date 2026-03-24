// ─────────────────────────────────────────────────────────────
//  services/stripeService.js — Logique PaymentIntent Stripe v14
// ─────────────────────────────────────────────────────────────
const stripe = require('../config/stripe');

// ── Montants des plans d'abonnement (en Ariary) ──
const PLAN_AMOUNTS = {
  monthly: 500000,   // 5 000 Ar
  yearly:  5000000   // 50 000 Ar
};

/**
 * Crée un PaymentIntent pour un achat unitaire de contenu
 *
 * @param {string} userId     - ID utilisateur MongoDB
 * @param {string} contentId  - ID contenu MongoDB
 * @param {number} amount     - Montant en Ariary
 * @param {string} title      - Titre du contenu (pour Stripe Dashboard)
 * @returns {Promise<Stripe.PaymentIntent>}
 */
const createPurchaseIntent = async (userId, contentId, amount, title) => {
  return stripe.paymentIntents.create({
    amount,
    currency: 'mga',
    description: `Achat : ${title}`,
    metadata: {
      type:      'purchase',
      userId:    userId.toString(),
      contentId: contentId.toString()
    }
  });
};

/**
 * Crée un PaymentIntent pour un abonnement Premium
 *
 * @param {string} userId  - ID utilisateur MongoDB
 * @param {string} plan    - 'monthly' | 'yearly'
 * @returns {Promise<Stripe.PaymentIntent>}
 */
const createSubscriptionIntent = async (userId, plan) => {
  const amount = PLAN_AMOUNTS[plan];
  if (!amount) throw new Error('Plan invalide');

  return stripe.paymentIntents.create({
    amount,
    currency: 'mga',
    description: `Abonnement Premium ${plan === 'monthly' ? 'Mensuel' : 'Annuel'}`,
    metadata: {
      type:   'subscription',
      userId: userId.toString(),
      plan
    }
  });
};

/**
 * Construit et vérifie un événement Stripe depuis le webhook
 */
const constructWebhookEvent = (payload, signature) => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

module.exports = {
  createPurchaseIntent,
  createSubscriptionIntent,
  constructWebhookEvent,
  PLAN_AMOUNTS
};
