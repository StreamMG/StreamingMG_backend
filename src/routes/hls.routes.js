// ─────────────────────────────────────────────────────────────
//  routes/hls.routes.js — S4 : /api/hls + /hls (segments statiques)
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const express = require('express');
const path    = require('path');
const { getHlsToken } = require('../controllers/hlsController');
const { authOptional } = require('../middlewares/auth');
const checkAccess    = require('../middlewares/checkAccess');
const hlsTokenMiddleware = require('../middlewares/hlsTokenizer');

// ── Génération du token HLS ──
// JWT + checkAccess → retourne { hlsUrl, expiresIn: 600 }
router.get('/:contentId/token', authOptional, checkAccess, getHlsToken);

// ── Segments HLS — protégés par hlsTokenizer ──
// Le manifest et les .ts sont servis par Express Static APRÈS validation token
// Ces routes sont montées directement sur /hls dans app.js via express.static
// mais avec le middleware hlsTokenizer qui intercepte AVANT le static

module.exports = router;
