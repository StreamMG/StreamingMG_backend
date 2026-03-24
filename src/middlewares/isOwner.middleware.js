// ─────────────────────────────────────────────────────────────
//  middlewares/isOwner.middleware.js
//  Vérifie que uploadedBy du contenu === req.user.id
// ─────────────────────────────────────────────────────────────
const Content = require('../models/Content.model');

module.exports = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id).select('uploadedBy');
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });
    if (String(content.uploadedBy) !== String(req.user?.id) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé à ce contenu' });
    }
    next();
  } catch (err) { next(err); }
};
