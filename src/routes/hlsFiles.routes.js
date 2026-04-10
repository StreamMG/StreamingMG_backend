// ─────────────────────────────────────────────────────────────
//  routes/hlsFiles.routes.js — FIX WINDOWS
// ─────────────────────────────────────────────────────────────
const router  = require('express').Router({ mergeParams: true });
const express = require('express');
const path    = require('path');
const fs      = require('fs');
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
  const filePath = path.join(__dirname, '../../uploads/hls', contentId, 'index.m3u8');
  
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
    fallthrough: true // Permet de passer au middleware suivant (ou 404) si le fichier n'existe pas
  })(req, res, next);
});

module.exports = router;