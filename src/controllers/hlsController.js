// ─────────────────────────────────────────────────────────────
//  controllers/hlsController.js — S4 : Génération token HLS
//  GET /api/hls/:contentId/token → { hlsUrl, expiresIn: 600 }
// ─────────────────────────────────────────────────────────────
const { generateFingerprint, generateHlsToken } = require('../utils/crypto.utils');
const Content = require('../models/Content.model');

// ─────────────────────────────────────────────────────────────
//  GET /api/hls/:contentId/token
//  checkAccess déjà validé → l'utilisateur a le droit
// ─────────────────────────────────────────────────────────────
const getHlsToken = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    
    // Vérification de la disponibilité du fichier
    const content = await Content.findById(contentId);
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });
    if (!content.hlsPath) return res.status(400).json({ message: 'Vidéo en cours de traitement, veuillez patienter...' });


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

    // Injecter le token dans un cookie strictement lié au chemin de ce contenu
    res.cookie(`hlsToken_${contentId}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: `/hls/${contentId}`,
      maxAge: (parseInt(process.env.HLS_TOKEN_EXPIRY) || 600) * 1000
    });

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
