// ─────────────────────────────────────────────────────────────
//  routes/hlsFiles.routes.js — Servir les fichiers .ts et .m3u8
//  Montés sur /hls/:contentId/ dans app.js
//  Protégés par hlsTokenizer
// ─────────────────────────────────────────────────────────────
const router  = require('express').Router({ mergeParams: true });
const express = require('express');
const path    = require('path');
const hlsTokenMiddleware = require('../middlewares/hlsTokenizer.middleware');

// Toutes les routes /hls/:contentId/* nécessitent le token
router.use(hlsTokenMiddleware);

// Servir les fichiers statiques HLS (manifest + segments)
// Utilise le contentId des paramètres pour cibler le bon dossier
router.use((req, res, next) => {
  const { contentId } = req.params;
  const hlsPath = path.join(__dirname, '../uploads/hls', contentId);
  
  express.static(hlsPath, {
    dotfiles: 'deny',
    index: false
  })(req, res, next);
});

module.exports = router;
