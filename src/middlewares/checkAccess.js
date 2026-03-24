// ─────────────────────────────────────────────────────────────
//  middlewares/checkAccess.js — Logique freemium centrale ⭐
//  POINT CRITIQUE : Premium ≠ couvre les contenus "paid"
//  TF-ACC-06 : role:premium + contenu paid → 403 purchase_required
// ─────────────────────────────────────────────────────────────
const Content  = require('../models/Content.model');
const Purchase = require('../models/Purchase.model');

async function checkAccess(req, res, next) {
  try {
    // Récupère le contentId depuis params (/:id ou /:contentId)
    const contentId = req.params.id || req.params.contentId;

    if (!contentId) {
      return res.status(400).json({ message: 'contentId requis' });
    }

    const content = await Content.findById(contentId).select('accessType price isPublished');

    if (!content) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    // Contenu non publié → seul l'admin ou le provider peuvent y accéder
    if (!content.isPublished && req.user?.role !== 'admin' && req.user?.role !== 'provider') {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    switch (content.accessType) {

      // ─── GRATUIT : tout le monde peut accéder ───
      case 'free':
        return next();

      // ─── PREMIUM : nécessite abonnement actif ───
      case 'premium':
        if (!req.user) {
          return res.status(403).json({ reason: 'login_required' });
        }
        if (!['premium', 'admin'].includes(req.user.role)) {
          return res.status(403).json({ reason: 'subscription_required' });
        }
        return next();

      // ─── PAYANT : nécessite un achat spécifique ───
      // ⚠️ L'abonnement PREMIUM ne couvre PAS les contenus "paid"
      case 'paid':
        if (!req.user) {
          return res.status(403).json({ reason: 'login_required' });
        }

        // Admin bypass
        if (req.user.role === 'admin') {
          return next();
        }

        // Vérifier l'achat en base — peu importe le rôle (même premium)
        const purchase = await Purchase.findOne({
          userId:    req.user.id,
          contentId: content._id
        });

        if (!purchase) {
          // TF-ACC-06 : Premium sans achat → 403 purchase_required
          return res.status(403).json({
            reason: 'purchase_required',
            price:  content.price
          });
        }

        return next();

      default:
        return res.status(403).json({ reason: 'access_denied' });
    }

  } catch (err) {
    next(err);
  }
}

module.exports = checkAccess;
