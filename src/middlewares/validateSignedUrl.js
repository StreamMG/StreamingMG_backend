// ─────────────────────────────────────────────────────────────
//  middlewares/validateSignedUrl.js — Vérification URL signée AES
//  Route : GET /private/:contentId?expires=...&sig=...
// ─────────────────────────────────────────────────────────────
const crypto = require('crypto');

const validateSignedUrl = (req, res, next) => {
  const { expires, sig } = req.query;
  const { contentId } = req.params;

  if (!expires || !sig) {
    return res.status(403).json({ message: 'Paramètres de signature manquants' });
  }

  // Vérifier l'expiration
  if (Date.now() > parseInt(expires)) {
    return res.status(403).json({ message: 'URL expirée' });
  }

  // Recalculer la signature HMAC-SHA256
  const filePath = `uploads/private/${contentId}_src.mp4`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.SIGNED_URL_SECRET)
    .update(`${filePath}|${expires}`)
    .digest('hex');

  if (sig !== expectedSig) {
    return res.status(403).json({ message: 'Signature invalide' });
  }

  next();
};

module.exports = validateSignedUrl;
