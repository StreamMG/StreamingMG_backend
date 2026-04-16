const { verifyHlsToken, generateFingerprint } = require('../utils/crypto.utils');

module.exports = (req, res, next) => {
  const contentId = req.params.contentId || req.originalUrl.split('/hls/')[1]?.split('/')[0];
  const token = req.query.token || (req.cookies && req.cookies[`hlsToken_${contentId}`]);
  
  if (!token)
    return res.status(403).json({ message: 'Token HLS manquant', code: 'HLS_TOKEN_MISSING' });

  const payload = verifyHlsToken(token);
  
  if (!payload) {
    return res.status(403).json({ 
      message: 'Signature HLS invalide ou expirée', 
      code: 'HLS_TOKEN_INVALID' 
    });
  }

  // Aiguillage conditionnel Web vs Mobile (Hybride)
  if (payload.p === 'web' || !payload.p) {
    const currentFp = generateFingerprint(
      req.headers['user-agent'] || '',
      req.ip || '',
      req.cookies?.sessionId || ''
    );
    if (payload.fingerprint !== currentFp) {
      return res.status(403).json({ 
        message: 'Fingerprint mismatch. Accès bloqué.', 
        code: 'HLS_FINGERPRINT_MISMATCH' 
      });
    }
  } else if (payload.p === 'mobile') {
    // Mode "Voie Rapide Mobile" : HMAC garantit l'intégrité, on bypass IP/UA.
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

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};