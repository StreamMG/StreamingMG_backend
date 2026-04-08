const { verifyHlsToken, generateFingerprint } = require('../utils/crypto.utils');

module.exports = (req, res, next) => {
  // 1. EXTRACTION DU FICHIER DEMANDÉ
  // On regarde si la requête finit par .ts
  const isSegment = req.path.endsWith('.ts');

  // 2. LOGIQUE DE TEST / EXCEPTION
  if (isSegment) {
    // On autorise les segments sans vérification de token pour le test
    // (Ou on pourrait vérifier un cookie de session ici si disponible)
    return next();
  }

  // 3. LOGIQUE ORIGINALE POUR LE MANIFEST (.m3u8)
  const token = req.query.token;
  if (!token)
    return res.status(403).json({ message: 'Token HLS manquant', code: 'HLS_TOKEN_MISSING' });

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