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
router.use(
  express.static(path.join(__dirname, '../uploads/hls'), {
    // Empêcher le listing des répertoires
    dotfiles: 'deny',
    index: false
  })
);

module.exports = router;
