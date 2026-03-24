// ─────────────────────────────────────────────────────────────
//  middlewares/hlsTokenizer.js — Token HLS + Fingerprint SHA-256
//  Bloque IDM, JDownloader, copie URL, partage de lien
// ─────────────────────────────────────────────────────────────
const { verifyHlsToken } = require('../services/cryptoService');

const hlsTokenMiddleware = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res.status(403).json({ message: 'Token HLS requis' });
  }

  try {
    const payload = verifyHlsToken(token, req);

    // Vérifier que le contentId du token correspond à la route
    if (payload.contentId !== req.params.contentId) {
      return res.status(403).json({ message: 'Token invalide pour ce contenu' });
    }

    req.hlsPayload = payload;
    next();

  } catch (err) {
    if (err.message === 'Fingerprint mismatch') {
      return res.status(403).json({
        message: 'Session invalide — copie d\'URL non autorisée'
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token HLS expiré' });
    }
    return res.status(403).json({ message: 'Token HLS invalide' });
  }
};

module.exports = hlsTokenMiddleware;
