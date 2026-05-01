const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { authOptional } = require('../middlewares/auth');
const checkAccess = require('../middlewares/checkAccess');

// Route existante pour le mobile (Expo-AV) qui expose l'URL brute (non modifiée)
router.get('/:id/url', authOptional, checkAccess, audioController.getAudioUrl);

// ─────────────────────────────────────────────────────────────
// NOUVEAUX ENDPOINTS : Audio Web Protégé (Anti-IDM)
// ─────────────────────────────────────────────────────────────

// 1. Génération du token pour le Web
router.get('/:id/web-token', authOptional, checkAccess, audioController.getWebAudioToken);

// Limiteur Anti-Aspiration (Bloque XDM/IDM)
// 15 requêtes max par minute. Un lecteur audio va généralement faire 2 à 5 requêtes de buffer.
const rateLimit = require('express-rate-limit');
const audioAspirationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requêtes max pour le streaming par IP
  keyGenerator: (req) => {
    const token = req.query.token || (req.cookies && req.cookies[`audioToken_${req.params.id}`]) || 'anonymous';
    return `${req.ip}_${token}`;
  },
  message: { 
    message: 'Téléchargement détecté (Anti-IDM/XDM). L\'utilisation d\'aspirateurs de musique est interdite.', 
    code: 'RATE_LIMIT_ANTI_DOWNLOAD' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Stream sécurisé avec vérification token + fingerprint + rate limiting
router.get('/:id/stream', audioAspirationLimiter, audioController.streamWebAudio);

module.exports = router;
