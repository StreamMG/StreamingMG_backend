// ─────────────────────────────────────────────────────────────
//  middlewares/validateSignedUrl.js — Vérification URL signée AES
//  Route : GET /private/:contentId?expires=...&sig=...
// ─────────────────────────────────────────────────────────────
const path = require('path');
const Content = require('../models/Content.model');
const crypto = require('crypto');

const validateSignedUrl = async (req, res, next) => {
  try {
    const { expires, sig } = req.query;
    const { contentId } = req.params;

    if (!expires || !sig) {
      return res.status(403).json({ message: 'Paramètres de signature manquants' });
    }

    // Vérifier l'expiration
    if (Date.now() > parseInt(expires)) {
      return res.status(403).json({ message: 'URL expirée' });
    }

    // Récupérer le contenu pour avoir le chemin réel
    const content = await Content.findById(contentId).select('type audioPath filePath');
    if (!content) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    let filePath;
    if (content.type === 'audio' && content.audioPath) {
      filePath = `uploads/audio/${path.basename(content.audioPath)}`;
    } else {
      filePath = `uploads/private/${contentId}_src.mp4`;
    }

    // Recalculer la signature HMAC-SHA256
    const expectedSig = crypto
      .createHmac('sha256', process.env.SIGNED_URL_SECRET)
      .update(`${filePath}|${expires}`)
      .digest('hex');

    if (sig !== expectedSig) {
      return res.status(403).json({ message: 'Signature invalide' });
    }

    // Passer le chemin résolu au contrôleur
    req.resolvedFilePath = filePath;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validateSignedUrl;
