// ─────────────────────────────────────────────────────────────
//  middlewares/hlsTokenizer.middleware.js
//  ★ HMAC-SHA256 + fingerprint — Référence : PorteOuverteV2 §5
//  Utilise crypto.utils.js conforme au user_global
// ─────────────────────────────────────────────────────────────
const { verifyHlsToken } = require('../services/cryptoService');

module.exports = (req, res, next) => {
  const token = req.query.token;
  if (!token)
    return res.status(403).json({ message: 'Token HLS manquant', code: 'HLS_TOKEN_MISSING' });

  try {
    const payload = verifyHlsToken(token, req);
    
    // Vérifie correspondance contentId URL ↔ token
    const routeId = req.params.contentId;
    if (routeId && payload.contentId !== routeId)
      return res.status(403).json({ message: 'Token non applicable à ce contenu', code: 'HLS_TOKEN_MISMATCH' });

    req.hlsPayload = payload;

    // Anti-cache / anti-téléchargement
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    next();
  } catch (err) {
    return res.status(403).json({ 
      message: 'Token HLS invalide ou expiré', 
      code: 'HLS_TOKEN_INVALID' 
    });
  }
};
