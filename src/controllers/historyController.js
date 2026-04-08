// ─────────────────────────────────────────────────────────────
//  controllers/historyController.js — S5 : Historique visionnage
// ─────────────────────────────────────────────────────────────
const WatchHistory = require('../models/WatchHistory.model');
const Content      = require('../models/Content.model');

// ─────────────────────────────────────────────────────────────
//  POST /api/history/:contentId — Enregistrer/MAJ progression
// ─────────────────────────────────────────────────────────────
// console.log('Entrer dans historyController.js');
const recordHistory = async (req, res, next) => {
  // console.log('HISTORY HANDLER');
  try {
    const { contentId }        = req.params;
    const { progress = 0, completed = false } = req.body;
    const userId               = req.user.id;

    // Vérifier que le contenu existe
    const content = await Content.findById(contentId).select('duration');
    if (!content) {
      return res.status(404).json({ message: 'Contenu introuvable' });
    }

    // Calculer si terminé automatiquement (>90% de la durée)
    const isCompleted = completed ||
      (content.duration > 0 && progress >= content.duration * 0.9);

    // Upsert — met à jour ou crée
    const history = await WatchHistory.findOneAndUpdate(
      { userId, contentId },
      {
        userId,
        contentId,
        progress,
        completed: isCompleted,
        watchedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return res.json({ history });
  } catch (err) {

    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/history — Historique de l'utilisateur
// ─────────────────────────────────────────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await WatchHistory.countDocuments({ userId });

    const history = await WatchHistory
      .find({ userId })
      .populate('contentId', 'title thumbnail type duration accessType')
      .sort({ watchedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.json({
      history,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { recordHistory, getHistory };
