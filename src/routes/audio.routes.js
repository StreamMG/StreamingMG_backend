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
// Avec le découpage forcé (500 KB/chunk), une musique de 4MB nécessite ~8 requêtes.
// Un lecteur normal demandera un chunk toutes les ~20s. XDM/IDM les demandera tous d'un coup.
const rateLimit = require('express-rate-limit');
const audioAspirationLimiter = rateLimit({
  windowMs: 10 * 1000, // Fenêtre de 10 secondes
  max: 4, // Bloque au-delà de 4 requêtes par 10s
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
