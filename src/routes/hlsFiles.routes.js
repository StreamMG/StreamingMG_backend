// ─────────────────────────────────────────────────────────────
//  routes/hlsFiles.routes.js — Servir les fichiers .ts et .m3u8
//  Montés sur /hls/:contentId/ dans app.js
//  Protégés par hlsTokenizer
// ─────────────────────────────────────────────────────────────
const router  = require('express').Router({ mergeParams: true });
const express = require('express');
const path    = require('path');
const hlsTokenMiddleware = require('../middlewares/hlsTokenizer.middleware');
const rateLimit = require('express-rate-limit');

// Limiteur Anti-Aspiration (Bloque IDM et les téléchargements parallèles)
// Un lecteur normal (~5s par segment) fera environ 12 requêtes par minute.
// IDM tentera d'en faire 16 à 32 d'un coup. S'il dépasse 30 requêtes par minute, on bloque.
const antiAspirationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limite stricte de 30 segments (soit ~150s de vidéo) par minute par IP
  message: { 
    message: 'Téléchargement parallèle détecté (Anti-IDM). Ralentissez ou désactivez votre aspirateur de vidéo.', 
    code: 'RATE_LIMIT_ANTI_DOWNLOAD' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Toutes les routes /hls/:contentId/* nécessitent le token
router.use(hlsTokenMiddleware);

// Appliquer le filtre anti-aspiration sur cette sous-route
router.use(antiAspirationLimiter);

// Servir les fichiers statiques HLS (manifest + segments)
// Utilise le contentId des paramètres pour cibler le bon dossier
router.use((req, res, next) => {
  const { contentId } = req.params;
  const hlsPath = path.join(__dirname, '../../uploads/hls', contentId);
  
  express.static(hlsPath, {
    dotfiles: 'deny',
    index: false
  })(req, res, next);
});

module.exports = router;
