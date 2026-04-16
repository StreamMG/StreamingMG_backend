// ─────────────────────────────────────────────────────────────
//  controllers/providerController.js — S3/S8 : Espace Fournisseur
//  Upload multipart — thumbnail OBLIGATOIRE
// ─────────────────────────────────────────────────────────────
const path    = require('path');
const fs      = require('fs');
const Content = require('../models/Content.model');
const { transcodeToHls, getVideoDuration, deleteHlsFiles } = require('../services/ffmpegService');
const logger  = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
//  POST /api/provider/contents — Upload contenu
// ─────────────────────────────────────────────────────────────
const uploadContent = async (req, res, next) => {
  console.log('📤 Upload contenu initié par fournisseur:', req.user.id);
  try {
    const {
      title, description, type, category,
      language, accessType, price, isTutorial
    } = req.body;

    // ── Récupérer les fichiers Multer ──
    const thumbnailFile = req.files?.thumbnail?.[0];
    const mediaFile     = req.files?.media?.[0];

    // validateThumbnail middleware s'en charge mais double vérification
    if (!thumbnailFile) {
      console.log('❌ Upload échoué : vignette manquante');
      return res.status(400).json({ message: 'La vignette est obligatoire.' });
    }

    if (!mediaFile) {
      console.log('❌ Upload échoué : fichier media manquant');
      return res.status(400).json({ message: 'Le fichier media est obligatoire.' });
    }

    // ── Construire l'objet contenu ──
    const contentData = {
      title,
      description: description || '',
      type,
      category,
      language:   language || 'mg',
      accessType: accessType || 'free',
      price:      accessType === 'paid' ? parseInt(price) : null,
      isTutorial: isTutorial === 'true',
      thumbnail:  `/uploads/thumbnails/${thumbnailFile.filename}`,
      uploadedBy: req.user.id,
      isPublished: false  // En attente validation admin
    };

    // Créer le contenu en base pour obtenir l'_id
    const content = await Content.create(contentData);
   
    // ── Traitement asynchrone du media ──
    if (type === 'video') {
      // Lancer le transcoding HLS en arrière-plan
      const inputPath = mediaFile.path;
      transcodeToHls(inputPath, content._id.toString())
        .then(async (hlsPath) => {
          const duration = await getVideoDuration(inputPath).catch(() => 0);
          await Content.findByIdAndUpdate(content._id, { hlsPath, duration });
          // Déplacer le fichier source vers /uploads/private/
          const destPath = path.resolve(process.cwd(), `uploads/private/${content._id}_src.mp4`);
          fs.renameSync(inputPath, destPath);
        })
        .catch((err) => {
          logger.error(`❌ Transcoding échoué [${content._id}]: ${err.message}`);
          Content.findByIdAndUpdate(content._id, { isPublished: false }).catch(() => {});
        });

    } else if (type === 'audio') {
      // Audio — déjà dans /uploads/audio/
      // console.log("dans le transcoder")
      const audioPath = `/uploads/audio/${mediaFile.filename}`;
      let duration = 0;
      try {
        const mm = await import('music-metadata');
        const metadata = await mm.parseFile(mediaFile.path);
        duration = Math.floor(metadata.format.duration || 0);
        // Extraire métadonnées ID3
        const { artist, album } = metadata.common;
        await Content.findByIdAndUpdate(content._id, {
          audioPath, duration,
          artist: artist || null,
          album:  album  || null
        });
      } catch(e) {
        console.log('⚠️ Impossible d\'extraire la durée ou les métadonnées ID3 de l\'audio:', e.message);
        await Content.findByIdAndUpdate(content._id, { audioPath, duration });
      }
    }

     console.log('✅ Fichiers reçus :', {
      thumbnail: thumbnailFile.filename,
      media: mediaFile.filename,
      type
    });

    return res.status(201).json({
      message: 'Contenu uploadé — en attente de validation',
      contentId: content._id
    });

  } catch (err) {
    console.error('❌ Erreur lors de l\'upload du contenu:', err);
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/provider/contents — Ses propres contenus
// ─────────────────────────────────────────────────────────────
const getMyContents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Content.countDocuments({ uploadedBy: req.user.id });

    const contents = await Content
      .find({ uploadedBy: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.json({ contents, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/provider/contents/:id — Modifier métadonnées
// ─────────────────────────────────────────────────────────────
const updateContent = async (req, res, next) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, uploadedBy: req.user.id });
    if (!content) return res.status(404).json({ message: 'Contenu introuvable ou non autorisé' });

    const allowed = ['title', 'description', 'category', 'language', 'isTutorial'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) content[field] = req.body[field];
    });

    await content.save();
    return res.json({ message: 'Contenu mis à jour', content });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/provider/contents/:id/thumbnail — Remplacer vignette
// ─────────────────────────────────────────────────────────────
const replaceThumbnail = async (req, res, next) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, uploadedBy: req.user.id });
    if (!content) return res.status(404).json({ message: 'Contenu introuvable ou non autorisé' });

    if (!req.file) return res.status(400).json({ message: 'La vignette est obligatoire.' });

    // Supprimer l'ancienne vignette
    if (content.thumbnail) {
      const oldPath = path.resolve(process.cwd(), content.thumbnail.startsWith('/') ? content.thumbnail.slice(1) : content.thumbnail);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    content.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    await content.save();

    return res.json({ message: 'Vignette remplacée', thumbnail: content.thumbnail });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/provider/contents/:id/access — Modifier accès/prix
// ─────────────────────────────────────────────────────────────
const updateAccess = async (req, res, next) => {
  try {
    const { accessType, price } = req.body;
    const content = await Content.findOne({ _id: req.params.id, uploadedBy: req.user.id });
    if (!content) return res.status(404).json({ message: 'Contenu introuvable ou non autorisé' });

    if (accessType) content.accessType = accessType;
    if (accessType === 'paid') content.price = parseInt(price) || 0;
    else content.price = null;

    await content.save();
    return res.json({ message: 'Accès mis à jour' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/provider/contents/:id/lessons — Réorganiser leçons
// ─────────────────────────────────────────────────────────────
const updateLessons = async (req, res, next) => {
  try {
    const { lessons } = req.body;
    const content = await Content.findOne({ _id: req.params.id, uploadedBy: req.user.id });
    if (!content) return res.status(404).json({ message: 'Contenu introuvable ou non autorisé' });

    if (!Array.isArray(lessons)) return res.status(400).json({ message: 'lessons doit être un tableau' });

    content.lessons = lessons;
    await content.save();
    return res.json({ message: 'Leçons mises à jour', lessons: content.lessons });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/provider/contents/:id
// ─────────────────────────────────────────────────────────────
const deleteContent = async (req, res, next) => {
  try {
    const content = await Content.findOne({ _id: req.params.id, uploadedBy: req.user.id });
    if (!content) return res.status(404).json({ message: 'Contenu introuvable ou non autorisé' });

    // Nettoyer les fichiers
    if (content.thumbnail) {
      const p = path.resolve(process.cwd(), content.thumbnail.startsWith('/') ? content.thumbnail.slice(1) : content.thumbnail);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    if (content.audioPath) {
      const p = path.resolve(process.cwd(), content.audioPath.startsWith('/') ? content.audioPath.slice(1) : content.audioPath);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    if (content.hlsPath) {
      deleteHlsFiles(content._id.toString());
    }

    await Content.deleteOne({ _id: content._id });
    return res.json({ message: 'Contenu supprimé' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadContent, getMyContents, updateContent,
  replaceThumbnail, updateAccess, updateLessons, deleteContent
};
