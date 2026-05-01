const Content = require('../models/Content.model');

// ─────────────────────────────────────────────────────────────
//  GET /api/audio/:contentId/url
//  checkAccess déjà validé → l'utilisateur a le droit
// ─────────────────────────────────────────────────────────────
exports.getAudioUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });

    // Selon le modèle, l'audio est dans audioPath ou filePath
    const path = content.audioPath || content.filePath;
    
    if (!path) {
      return res.status(404).json({ message: 'Fichier audio non disponible' });
    }

    // On retourne le chemin relatif normalisé
    // Assurez-vous que le chemin commence bien par /uploads/ (ex: /uploads/audio/music.mp3)
    let url = path.startsWith('/') ? path : `/${path}`;

    return res.json({ url });
  } catch (err) {
    next(err);
  }
};

const { generateFingerprint, generateHlsToken, verifyHlsToken } = require('../utils/crypto.utils');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
//  GET /api/audio/:id/web-token (POUR NAVIGATEUR UNIQUEMENT)
// ─────────────────────────────────────────────────────────────
exports.getWebAudioToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });

    const fingerprint = generateFingerprint(
      req.headers['user-agent'] || '',
      req.ip || '',
      req.cookies?.sessionId || ''
    );

    const token = generateHlsToken(id, req.user?.id || 'anonymous', fingerprint, 'web');

    res.cookie(`audioToken_${id}`, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: `/api/audio/${id}/stream`,
      maxAge: 600 * 1000
    });

    return res.json({ streamUrl: `/api/audio/${id}/stream?token=${token}` });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/audio/:id/stream (POUR NAVIGATEUR UNIQUEMENT)
// ─────────────────────────────────────────────────────────────
exports.streamWebAudio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.query.token || (req.cookies && req.cookies[`audioToken_${id}`]);

    if (!token) return res.status(403).json({ message: 'Token manquant', code: 'AUDIO_TOKEN_MISSING' });

    const payload = verifyHlsToken(token);
    if (!payload || payload.contentId !== id) {
      return res.status(403).json({ message: 'Signature audio invalide ou expirée', code: 'AUDIO_TOKEN_INVALID' });
    }

    const currentFp = generateFingerprint(
      req.headers['user-agent'] || '',
      req.ip || '',
      req.cookies?.sessionId || ''
    );

    if (payload.fingerprint !== currentFp) {
      return res.status(403).json({ message: 'Fingerprint mismatch. Accès bloqué.', code: 'AUDIO_FINGERPRINT_MISMATCH' });
    }

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });

    const filePathRelative = content.audioPath || content.filePath;
    if (!filePathRelative) return res.status(404).json({ message: 'Fichier non disponible' });

    const absolutePath = path.resolve(process.cwd(), filePathRelative.replace(/^\//, ''));
    
    if (!fs.existsSync(absolutePath)) {
       return res.status(404).json({ message: 'Fichier introuvable sur le disque' });
    }

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // 🛡️ ANTI-ASPIRATION (IDM/XDM) : Forcer un découpage de la piste (ex: 500 KB max)
      // Cela oblige le client à faire plusieurs requêtes. Les lecteurs légitimes liront au fur et à mesure.
      // IDM tentera de tout aspirer d'un coup et se fera attraper par le Rate Limiter.
      const CHUNK_SIZE = 500 * 1024; // 500 KB
      if (end - start >= CHUNK_SIZE) {
        end = start + CHUNK_SIZE - 1;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(absolutePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(absolutePath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
};
