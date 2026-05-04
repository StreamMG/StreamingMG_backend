// ─────────────────────────────────────────────────────────────
//  routes/hlsFiles.routes.js — FIX WINDOWS
// ─────────────────────────────────────────────────────────────
const router  = require('express').Router({ mergeParams: true });
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const hlsTokenMiddleware = require('../middlewares/hlsTokenizer.middleware');
const rateLimit = require('express-rate-limit');

// Limiteur Anti-Aspiration plus agressif (Bloque XDM/IDM)
// Un lecteur normal fait ~2 requêtes par 10 secondes (segments de 5s).
// XDM/IDM tentent d'en lancer plusieurs par seconde.
const antiAspirationLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 secondes
  max: 5, // Limite stricte de 5 segments par 10s
  keyGenerator: (req) => {
    // Lie la limite à l'IP ET au token (ou cookie) pour éviter de bloquer tout un réseau NAT
    const token = req.query.token || (req.cookies && req.cookies[`hlsToken_${req.params.contentId}`]) || 'anonymous';
    return `${req.ip}_${token}`;
  },
  message: { 
    message: 'Téléchargement détecté (Anti-IDM/XDM). L\'utilisation d\'aspirateurs de vidéos est interdite.', 
    code: 'RATE_LIMIT_ANTI_DOWNLOAD' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 1. Appliquer le middleware de sécurité sur toutes les requêtes du routeur
router.use(hlsTokenMiddleware);

// Appliquer le filtre anti-aspiration sur cette sous-route
router.use(antiAspirationLimiter);

// ── Règle Hybride : Intercepteur Mobile pour le Manifest ── 
// Permet de réécrire le manifeste dynamiquement pour apposer le Token sur tous les segments .ts (Expo-AV)
router.get('/index.m3u8', async (req, res, next) => {
  // Si ce n'est pas un lecteur Mobile, on ignore l'interception et le fichier est servi tel quel par express.static
  if (req.hlsPayload?.p !== 'mobile') return next();

  const { contentId } = req.params;
  const filePath = path.resolve(process.cwd(), 'uploads/hls', contentId, 'index.m3u8');
  
  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const token = req.query.token || (req.cookies && req.cookies[`hlsToken_${contentId}`]);
    
    // Injecte ?token=xyz sur toutes les lignes pointant vers un segment .ts
    const signedManifest = fileContent.replace(/(\.ts)/g, `.ts?token=${token}`);
    
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(signedManifest);
  } catch (error) {
    next(error);
  }
});

// Servir les fichiers statiques HLS (manifest + segments)
// Utilise le contentId des paramètres pour cibler le bon dossier
router.use((req, res, next) => {
  const { contentId } = req.params;
  
  // FIX : On utilise path.resolve + process.cwd() pour éviter les erreurs de dossier parent
  // Ton ffmpegService écrit dans : racine/uploads/hls/contentId
  const hlsPath = path.resolve(process.cwd(), 'uploads', 'hls', contentId);

  // DEBUG : Décommente la ligne suivante si la 404 persiste pour voir le chemin réel
  // console.log(`🔍 Tentative d'accès HLS sur : ${hlsPath}`);

  // On passe la main à express.static
  // On utilise req.url pour que static sache quel fichier (.m3u8 ou .ts) chercher dans hlsPath
  express.static(hlsPath, {
    dotfiles: 'deny',
    fallthrough: true, // Permet de passer au middleware suivant (ou 404) si le fichier n'existe pas
    setHeaders: (res, pathStr) => {
      if (pathStr.endsWith('.m3u8')) {
        // Ne jamais cacher le manifest
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      } else if (pathStr.endsWith('.ts')) {
        // Optimisation vidéo: cacher les segments (immuables) pour fluidifier la lecture / retours en arrière
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  })(req, res, next);
});

module.exports = router;