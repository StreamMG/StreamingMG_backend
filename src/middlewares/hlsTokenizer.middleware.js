// ─────────────────────────────────────────────────────────────
//  middlewares/hlsTokenizer.middleware.js
//  ★ HMAC-SHA256 + fingerprint — Référence : PorteOuverteV2 §5
//  Utilise crypto.utils.js conforme au user_global
// ─────────────────────────────────────────────────────────────
const { verifyHlsToken, generateFingerprint } = require('../utils/crypto.utils');

module.exports = (req, res, next) => {
  const contentId = req.params.contentId || req.originalUrl.split('/hls/')[1]?.split('/')[0];
  const token = req.query.token || (req.cookies && req.cookies[`hlsToken_${contentId}`]);
  
  if (!token)
    return res.status(403).json({ message: 'Token HLS manquant', code: 'HLS_TOKEN_MISSING' });

  // Recalcule le fingerprint conforme au design (UA + IP + sessionId)
  const currentFp = generateFingerprint(
    req.headers['user-agent'] || '',
    req.ip || '',
    req.cookies?.sessionId || ''
  );

  const payload = verifyHlsToken(token, currentFp);
  
  if (!payload) {
    return res.status(403).json({ 
      message: 'Token HLS invalide ou expiré', 
      code: 'HLS_TOKEN_INVALID' 
    });
  }

  // Vérifie correspondance contentId URL ↔ token
  const routeId = req.params.contentId;
  if (routeId && payload.contentId !== routeId) {
    return res.status(403).json({ 
      message: 'Token non applicable à ce contenu', 
      code: 'HLS_TOKEN_MISMATCH' 
    });
  }

  req.hlsPayload = payload;

  // Anti-cache / anti-téléchargement
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};
