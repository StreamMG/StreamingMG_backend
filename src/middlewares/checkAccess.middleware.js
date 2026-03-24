// ─────────────────────────────────────────────────────────────
//  middlewares/checkAccess.middleware.js — ★ Cœur modèle économique
//  RÈGLE-05 : Premium + paid → 403 purchase_required (JAMAIS passe-droit)
//  Référence : PorteOuverteV2/11_backend_conception.md §5
// ─────────────────────────────────────────────────────────────
const Content  = require('../models/Content.model');
const Purchase = require('../models/Purchase.model');

module.exports = async (req, res, next) => {
  try {
    const contentId = req.params.id || req.params.contentId;
    const content   = await Content.findById(contentId).select('accessType price');

    if (!content)
      return res.status(404).json({ message: 'Contenu introuvable' });

    switch (content.accessType) {

      // ── GRATUIT : tout le monde ──────────────────────────
      case 'free':
        return next();

      // ── PREMIUM : abonnement actif requis ────────────────
      case 'premium':
        if (!req.user)
          return res.status(403).json({ reason: 'login_required' });
        if (req.user.role === 'admin') return next();
        if (!['premium'].includes(req.user.role))
          return res.status(403).json({ reason: 'subscription_required' });
        return next();

      // ── PAYANT : achat unitaire requis ────────────────────
      // ⚠️  RÈGLE-05 : Premium n'ouvre JAMAIS les contenus paid
      case 'paid':
        if (!req.user)
          return res.status(403).json({ reason: 'login_required' });
        if (req.user.role === 'admin') return next();
        const purchase = await Purchase.findOne({
          userId:    req.user.id,
          contentId: content._id,
        });
        if (!purchase)
          return res.status(403).json({
            reason: 'purchase_required',
            price:  content.price,
          });
        return next();

      default:
        return res.status(403).json({ reason: 'access_denied' });
    }
  } catch (err) {
    next(err);
  }
};
