// ─────────────────────────────────────────────────────────────
//  controllers/hlsController.js — S4 : Génération token HLS
//  GET /api/hls/:contentId/token → { hlsUrl, expiresIn: 600 }
// ─────────────────────────────────────────────────────────────
const { computeFingerprint, generateHlsToken } = require('../services/cryptoService');

// ─────────────────────────────────────────────────────────────
//  GET /api/hls/:contentId/token
//  checkAccess déjà validé → l'utilisateur a le droit
// ─────────────────────────────────────────────────────────────
const getHlsToken = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    // Calcul du fingerprint (UA + IP + sessionId)
    const fingerprint = computeFingerprint(req);

    // Génère le token JWT HLS (10 min)
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
