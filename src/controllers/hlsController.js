// ─────────────────────────────────────────────────────────────
//  controllers/hlsController.js — S4 : Génération token HLS
//  GET /api/hls/:contentId/token → { hlsUrl, expiresIn: 600 }
// ─────────────────────────────────────────────────────────────
const { generateFingerprint, generateHlsToken } = require('../utils/crypto.utils');

// ─────────────────────────────────────────────────────────────
//  GET /api/hls/:contentId/token
//  checkAccess déjà validé → l'utilisateur a le droit
// ─────────────────────────────────────────────────────────────
const getHlsToken = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    // Calcul du fingerprint (UA + IP + sessionId) conforme au design
    const fingerprint = generateFingerprint(
      req.headers['user-agent'] || '',
      req.ip || '',
      req.cookies?.sessionId || ''
    );

    // Génère le token HMAC HLS conforme au design
    const token = generateHlsToken(
      contentId,
      req.user?.id || 'anonymous',
      fingerprint
    );

    // URL manifest signée
    const hlsUrl = `/hls/${contentId}/index.m3u8?token=${token}`;

    // TF-HLS-01 : retourne { hlsUrl, expiresIn: 600 }
    return res.json({
      hlsUrl,
      expiresIn: parseInt(process.env.HLS_TOKEN_EXPIRY) || 600
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { getHlsToken };
