// ─────────────────────────────────────────────────────────────
//  controllers/downloadController.js — Pipeline AES-256-GCM
//  POST /api/download/:contentId
//  → { aesKeyHex, ivHex, signedUrl, expiresIn }
//
//  RÈGLE-06 : La clé AES n'est JAMAIS stockée en base de données
//  Elle est générée à la volée et renvoyée UNE SEULE FOIS au client mobile.
//  Le client mobile chiffre le fichier téléchargé puis stocke la clé
//  dans le Keychain iOS / Keystore Android (expo-secure-store).
// ─────────────────────────────────────────────────────────────
const path    = require('path');
const fs      = require('fs');
const Content = require('../models/Content.model');
const aesService = require('../services/aes.service');
const { signDownloadUrl, verifySignedUrl } = require('../services/cryptoService');

// ─────────────────────────────────────────────────────────────
//  POST /api/download/:contentId
//  Pré-requis : auth.middleware + checkAccess déjà validés
// ─────────────────────────────────────────────────────────────
const requestDownload = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId)
      .select('filePath audioPath hlsPath type title accessType isPublished mimeType');

    if (!content) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    if (!content.isPublished) {
      return res.status(404).json({ message: 'Contenu non disponible' });
    }

    // ── Déterminer le chemin du fichier source ──────────────────
    // - Audio  : uploads/audio/<uuid>.mp3 (filePath stocké en BDD)
    // - Vidéo  : uploads/private/<contentId>_src.mp4
    let filePath;
    if (content.type === 'audio') {
      // Le providerController stocke l'audio dans audioPath
      // ex: "/uploads/audio/<uuid>.mp3" ou "uploads/audio/<uuid>.mp3"
      const src = content.audioPath || content.filePath;
      if (!src) {
        return res.status(404).json({
          message: 'Chemin audio introuvable en base de données.',
          code: 'FILE_NOT_FOUND'
        });
      }
      const basename = path.basename(src);
      filePath = `uploads/audio/${basename}`;
    } else {
      // Vidéo → source brute déplacée dans private/ après transcoding
      filePath = `uploads/private/${contentId}_src.mp4`;
    }

    // Vérifier que le fichier existe réellement sur le disque
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        message: 'Fichier source introuvable. Le transcodage est peut-être encore en cours.',
        code: 'FILE_NOT_FOUND'
      });
    }

    // ── Générer clé AES-256 (32 octets) + IV (16 octets) ────────
    // RÈGLE-06 : jamais stockés en base de données
    // Envoyés UNE SEULE FOIS au client — clé éphémère de session
    const { aesKeyHex, ivHex } = aesService.generateKey();

    // ── Générer URL signée HMAC-SHA256 (expiry 15 min = 900s) ───
    const expirySeconds = parseInt(process.env.SIGNED_URL_EXPIRY) || 900;
    const { signedUrl, expiry } = signDownloadUrl(filePath, contentId, expirySeconds);

    // ── Réponse JSON complète au client mobile ───────────────────
    // Conforme au schéma attendu par react-native-quick-crypto + expo-file-system
    return res.json({
      aesKeyHex,                    // 64 caractères hex = 256 bits
      ivHex,                        // 32 caractères hex = 128 bits
      signedUrl,                    // URL signée HMAC valide 15 min
      expiresIn: expirySeconds,     // Secondes avant expiration de l'URL
      contentType: content.type === 'audio' ? 'audio/mpeg' : 'video/mp4',
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /private/:contentId?expires=...&sig=...
//  Sert le fichier source après vérification de l'URL signée.
//  Supporte les Range Requests (reprises réseau mobile — contexte malgache).
//  validateSignedUrl middleware requis avant ce handler.
// ─────────────────────────────────────────────────────────────
const servePrivateFile = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const filePath = req.resolvedFilePath; // Fourni par validateSignedUrl

    if (!filePath) {
      return res.status(404).json({ message: 'Chemin de fichier non résolu' });
    }

    const absolutePath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Fichier source introuvable sur le disque' });
    }

    const content = await Content.findById(contentId).select('type');
    const contentType = content?.type === 'audio' ? 'audio/mpeg' : 'video/mp4';

    const stat = fs.statSync(absolutePath);
    const range = req.headers.range;

    if (range) {
      // ── Support des Range Requests (téléchargement par chunks) ──
      // Critique pour expo-file-system.createDownloadResumable sur mobile
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end   = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

      if (start >= stat.size || end >= stat.size || start > end) {
        res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
        return;
      }

      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Content-Type':   contentType,
        // Headers mobiles critiques pour la reprise de téléchargement
        'Cache-Control':  'no-store',
      });

      fs.createReadStream(absolutePath, { start, end }).pipe(res);

    } else {
      // ── Téléchargement complet ───────────────────────────────────
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type':   contentType,
        'Accept-Ranges':  'bytes',
        'Cache-Control':  'no-store',
      });
      fs.createReadStream(absolutePath).pipe(res);
    }

  } catch (err) {
    next(err);
  }
};

module.exports = { requestDownload, servePrivateFile };
