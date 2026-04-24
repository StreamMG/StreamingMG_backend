// ─────────────────────────────────────────────────────────────
//  middlewares/validateSignedUrl.js
//  Vérification de l'URL signée HMAC-SHA256 avant servePrivateFile
//  Route : GET /private/:contentId?expires=...&sig=...
//
//  FIX : reconstruction du filePath identique à signDownloadUrl
//  (audio → uploads/audio/basename, vidéo → uploads/private/id_src.mp4)
// ─────────────────────────────────────────────────────────────
const path    = require('path');
const crypto  = require('crypto');
const Content = require('../models/Content.model');

const validateSignedUrl = async (req, res, next) => {
  try {
    const { expires, sig } = req.query;
    const { contentId }    = req.params;

    // ── Paramètres obligatoires ──────────────────────────────
    if (!expires || !sig) {
      return res.status(403).json({
        message: 'Paramètres de signature manquants',
        code: 'MISSING_PARAMS'
      });
    }

    // ── Vérification de l'expiration ─────────────────────────
    if (Date.now() > parseInt(expires)) {
      return res.status(403).json({
        message: 'URL expirée. Veuillez relancer le téléchargement.',
        code: 'URL_EXPIRED'
      });
    }

    // ── Reconstruction du filePath identique à signDownloadUrl ─
    // CRITIQUE : le filePath doit être le MÊME que celui utilisé pour signer
    const content = await Content.findById(contentId)
      .select('type filePath audioPath');

    if (!content) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    let filePath;
    if (content.type === 'audio') {
      // Priorité audioPath (providerController stocke dans audioPath)
      // puis filePath en fallback
      const src = content.audioPath || content.filePath;
      if (!src) {
        return res.status(403).json({
          message: 'Chemin audio introuvable — signature impossible à vérifier',
          code: 'INVALID_SIGNATURE'
        });
      }
      const basename = path.basename(src);
      filePath = `uploads/audio/${basename}`;
    } else {
      // Vidéo → source brute dans private/
      filePath = `uploads/private/${contentId}_src.mp4`;
    }

    // ── Recalcul HMAC-SHA256 ─────────────────────────────────
    const expectedSig = crypto
      .createHmac('sha256', process.env.SIGNED_URL_SECRET)
      .update(`${filePath}|${expires}`)
      .digest('hex');

    // timingSafeEqual pour éviter les timing attacks
    let sigValid = false;
    try {
      sigValid = crypto.timingSafeEqual(
        Buffer.from(sig,         'hex'),
        Buffer.from(expectedSig, 'hex')
      );
    } catch {
      // Buffer de longueur différente → sig invalide
      sigValid = false;
    }

    if (!sigValid) {
      return res.status(403).json({
        message: 'Signature invalide',
        code: 'INVALID_SIGNATURE'
      });
    }

    // ── Passer le chemin résolu au contrôleur ────────────────
    req.resolvedFilePath = filePath;
    next();

  } catch (err) {
    next(err);
  }
};

module.exports = validateSignedUrl;
