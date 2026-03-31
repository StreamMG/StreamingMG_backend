// ─────────────────────────────────────────────────────────────
//  routes/hlsFiles.routes.js — FIX WINDOWS
// ─────────────────────────────────────────────────────────────
const router  = require('express').Router({ mergeParams: true });
const express = require('express');
const path    = require('path');
const hlsTokenMiddleware = require('../middlewares/hlsTokenizer.middleware');

// 1. Appliquer le middleware de sécurité sur toutes les requêtes du routeur
router.use(hlsTokenMiddleware);

/**
 * Servir les fichiers statiques HLS
 * On utilise process.cwd() pour garantir qu'on part de la racine du projet
 */
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