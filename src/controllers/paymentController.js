// ─────────────────────────────────────────────────────────────
//  controllers/paymentController.js — S7 (inclus pour complétude)
//  Stripe SDK v14 — PaymentIntent + Webhook handler
// ─────────────────────────────────────────────────────────────
const User        = require('../models/User.model');
const Content     = require('../models/Content.model');
const Purchase    = require('../models/Purchase.model');
const Transaction = require('../models/Transaction.model');
const {
  createPurchaseIntent,
  createSubscriptionIntent,
  constructWebhookEvent
} = require('../services/stripeService');

// ─────────────────────────────────────────────────────────────
//  POST /api/payment/subscribe — Abonnement Premium
// ─────────────────────────────────────────────────────────────
const subscribe = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ message: 'Plan invalide. Utilisez monthly ou yearly.' });
    }

    // MOCK Mada-Network : Valide automatiquement l'abonnement même en Prod
    const premiumExpiry = new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(req.user.id, {
      isPremium: true,
      role: 'premium',
      premiumExpiry
    });
    return res.json({ 
      clientSecret: 'mock_success', 
      message: 'Abonnement activé automatiquement sans appeler Stripe.' 
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/payment/purchase — Achat unitaire
// ─────────────────────────────────────────────────────────────
const createPurchase = async (req, res, next) => {
  try {
    const { contentId } = req.body;
    const userId        = req.user.id;

    // Idempotence — vérifier doublon AVANT de créer le PaymentIntent
    const existing = await Purchase.findOne({ userId, contentId });
    if (existing) {
      return res.status(409).json({ message: 'Vous avez déjà acheté ce contenu' });
    }

    const content = await Content.findById(contentId).select('price title accessType');
    if (!content || content.accessType !== 'paid') {
      return res.status(400).json({ message: 'Contenu non achetable' });
    }

    // MOCK Mada-Network : Valide automatiquement l'achat unitaire même en Prod
    await Purchase.create({
      userId,
      contentId,
      stripePaymentId: 'mock_pi_' + Date.now(),
      amount: content.price,
      purchasedAt: new Date()
    });
    
    // TF-PUR-01 : retourne { clientSecret }
    return res.json({ 
      clientSecret: 'mock_success',
      message: 'Achat validé automatiquement sans appeler Stripe.' 
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/payment/webhook — Handler Stripe (express.raw)
// ─────────────────────────────────────────────────────────────
const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // TF-SEC-05 : Vérification signature → 400 si invalide
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const { metadata, id: stripePaymentId, amount } = event.data.object;

    try {
      if (metadata.type === 'subscription') {
        // ── Activation Premium ──
        const premiumExpiry = new Date(
          Date.now() + (metadata.plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
        );

        await User.findByIdAndUpdate(metadata.userId, {
          isPremium:     true,
          role:          'premium',
          premiumExpiry
        });

        // Anti-doublon webhook via index unique stripePaymentId
        await Transaction.findOneAndUpdate(
          { stripePaymentId },
          {
            userId:          metadata.userId,
            type:            'subscription',
            stripePaymentId,
            amount,
            plan:            metadata.plan,
            status:          'succeeded'
          },
          { upsert: true, new: true }
        );

      } else if (metadata.type === 'purchase') {
        // ── Achat unitaire ──
        // Index unique { userId, contentId } → idempotence webhook
        await Purchase.findOneAndUpdate(
          { userId: metadata.userId, contentId: metadata.contentId },
          {
            userId:          metadata.userId,
            contentId:       metadata.contentId,
            stripePaymentId,
            amount,
            purchasedAt:     new Date()
          },
          { upsert: true, new: true }
        );

        await Transaction.findOneAndUpdate(
          { stripePaymentId },
          {
            userId:          metadata.userId,
            type:            'purchase',
            stripePaymentId,
            amount,
            contentId:       metadata.contentId,
            status:          'succeeded'
          },
          { upsert: true, new: true }
        );
      }
    } catch (dbErr) {
      console.error('❌ Webhook DB error:', dbErr.message);
      // Retourner 200 pour éviter les retries Stripe sur des erreurs DB
    }
  }

  return res.json({ received: true });
};

// ─────────────────────────────────────────────────────────────
//  GET /api/payment/purchases — Liste des achats utilisateur
// ─────────────────────────────────────────────────────────────
const getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase
      .find({ userId: req.user.id })
      .populate('contentId', 'title thumbnail type duration')
      .sort({ purchasedAt: -1 })
      .lean();

    return res.json({ purchases });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/payment/status — Statut abonnement
// ─────────────────────────────────────────────────────────────
const getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('isPremium premiumExpiry role');

    return res.json({
      isPremium:     user.isPremium,
      premiumExpiry: user.premiumExpiry,
      role:          user.role
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { subscribe, createPurchase, handleWebhook, getPurchases, getStatus };
