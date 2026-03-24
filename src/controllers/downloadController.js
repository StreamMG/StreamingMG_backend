// ─────────────────────────────────────────────────────────────
//  controllers/downloadController.js — S6 : AES-256-GCM
//  POST /api/download/:contentId → { aesKeyHex, ivHex, signedUrl }
//  ⚠️ La clé AES n'est JAMAIS stockée en base de données
// ─────────────────────────────────────────────────────────────
const path    = require('path');
const fs      = require('fs');
const Content = require('../models/Content.model');
const { generateAesKey, generateIv, signDownloadUrl } = require('../services/cryptoService');

// ─────────────────────────────────────────────────────────────
//  POST /api/download/:contentId
//  checkAccess déjà validé → l'utilisateur a le droit
// ─────────────────────────────────────────────────────────────
const requestDownload = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId)
      .select('audioPath hlsPath type title accessType isPublished');

    if (!content || !content.isPublished) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    // Déterminer le fichier source à signer
    let filePath;
    if (content.type === 'audio' && content.audioPath) {
      // Audio : chemin relatif depuis /uploads/audio/
      filePath = `uploads/audio/${path.basename(content.audioPath)}`;
    } else {
      // Vidéo : fichier source dans /uploads/private/
      filePath = `uploads/private/${contentId}_src.mp4`;
    }

    // ── Générer clé AES-256 et IV ──────────────────────────
    // ⚠️ Jamais stocké en base de données
    const aesKey = generateAesKey();  // 32 octets = 256 bits
    const iv     = generateIv();      // 16 octets = 128 bits

    // ── Signer l'URL temporaire (15 min) ──────────────────
    const { signedUrl, expiry } = signDownloadUrl(contentId, filePath);

    // TF-AES-01 : aesKeyHex = 64 chars, ivHex = 32 chars
    return res.json({
      aesKeyHex:  aesKey.toString('hex'),   // 64 caractères hex
      ivHex:      iv.toString('hex'),        // 32 caractères hex
      signedUrl,
      expiresIn:  parseInt(process.env.SIGNED_URL_EXPIRY) || 900
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /private/:contentId — Servir le fichier source signé
//  validateSignedUrl middleware requis avant ce handler
// ─────────────────────────────────────────────────────────────
const servePrivateFile = async (req, res, next) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId).select('type audioPath');

    if (!content) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    let absolutePath;
    if (content.type === 'audio' && content.audioPath) {
      absolutePath = path.join(__dirname, '..', content.audioPath);
    } else {
      absolutePath = path.join(__dirname, `../uploads/private/${contentId}_src.mp4`);
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Fichier source introuvable' });
    }

    // Servir en streaming (supporte les reprises réseau)
    const stat   = fs.statSync(absolutePath);
    const range  = req.headers.range;

    if (range) {
      const parts  = range.replace(/bytes=/, '').split('-');
      const start  = parseInt(parts[0], 10);
      const end    = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Content-Type':   content.type === 'audio' ? 'audio/mpeg' : 'video/mp4'
      });

      fs.createReadStream(absolutePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type':   content.type === 'audio' ? 'audio/mpeg' : 'video/mp4'
      });
      fs.createReadStream(absolutePath).pipe(res);
    }

  } catch (err) {
    next(err);
  }
};

module.exports = { requestDownload, servePrivateFile };
