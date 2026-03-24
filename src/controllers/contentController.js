// ─────────────────────────────────────────────────────────────
//  controllers/contentController.js — S3 : Catalogue + Upload
//  Pagination, filtres, recherche full-text, trending
// ─────────────────────────────────────────────────────────────
const path    = require('path');
const Content = require('../models/Content.model');
const { transcodeToHls, getVideoDuration, deleteHlsFiles } = require('../services/ffmpegService');

// ── Champs publics retournés dans le catalogue ──
const PUBLIC_FIELDS = 'title description type category thumbnail accessType price isTutorial artist album duration viewCount featured language createdAt';

// ─────────────────────────────────────────────────────────────
//  GET /api/contents — Liste paginée avec filtres
// ─────────────────────────────────────────────────────────────
const getContents = async (req, res, next) => {
  try {
    const {
      page       = 1,
      limit      = 20,
      type,
      category,
      accessType,
      isTutorial,
      search
    } = req.query;

    const filter = { isPublished: true };

    if (type)       filter.type       = type;
    if (category)   filter.category   = category;
    if (accessType) filter.accessType = accessType;
    if (isTutorial !== undefined) filter.isTutorial = isTutorial === 'true';

    // Recherche full-text (index text sur title + description)
    if (search) {
      filter.$text = { $search: search };
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Content.countDocuments(filter);

    const contents = await Content
      .find(filter)
      .select(PUBLIC_FIELDS)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // ⚠️ Règle : thumbnail toujours présent et non null (TF-THUMB-06)
    return res.json({
      contents,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/contents/featured
// ─────────────────────────────────────────────────────────────
const getFeatured = async (req, res, next) => {
  try {
    const contents = await Content
      .find({ featured: true, isPublished: true })
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.json({ contents });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/contents/trending — Top 10 de la semaine
// ─────────────────────────────────────────────────────────────
const getTrending = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const contents = await Content
      .find({ isPublished: true, updatedAt: { $gte: oneWeekAgo } })
      .select(PUBLIC_FIELDS)
      .sort({ viewCount: -1 })
      .limit(10)
      .lean();

    return res.json({ contents });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/contents/:id — Détail d'un contenu
// ─────────────────────────────────────────────────────────────
const getContentById = async (req, res, next) => {
  try {
    const content = await Content
      .findOne({ _id: req.params.id, isPublished: true })
      .select(PUBLIC_FIELDS + ' lessons')
      .populate('uploadedBy', 'username')
      .lean();

    if (!content) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    return res.json({ content });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/contents/:id/view — Incrémenter le compteur de vues
// ─────────────────────────────────────────────────────────────
const incrementView = async (req, res, next) => {
  try {
    await Content.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    return res.json({ message: 'Vue enregistrée' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/contents/:id/lessons — Leçons d'un tutoriel
//  JWT + checkAccess requis
// ─────────────────────────────────────────────────────────────
const getLessons = async (req, res, next) => {
  try {
    const content = await Content
      .findOne({ _id: req.params.id, isTutorial: true, isPublished: true })
      .select('lessons title')
      .lean();

    if (!content) {
      return res.status(404).json({ message: 'Tutoriel introuvable' });
    }

    return res.json({
      contentId: content._id,
      title:     content.title,
      lessons:   content.lessons || []
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getContents,
  getFeatured,
  getTrending,
  getContentById,
  incrementView,
  getLessons
};
