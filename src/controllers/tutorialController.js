// ─────────────────────────────────────────────────────────────
//  controllers/tutorialController.js — S5 : Progression tutoriels
//  Upsert + calcul automatique percentComplete
// ─────────────────────────────────────────────────────────────
const TutorialProgress = require('../models/TutorialProgress.model');
const Content          = require('../models/Content.model');

// ─────────────────────────────────────────────────────────────
//  POST /api/tutorial/progress/:contentId — MAJ progression leçon
// ─────────────────────────────────────────────────────────────
const updateProgress = async (req, res, next) => {
  try {
    const { contentId }     = req.params;
    const { lessonIndex, completed = false } = req.body;
    const userId             = req.user.id;

    if (lessonIndex === undefined || lessonIndex === null) {
      return res.status(400).json({ message: 'lessonIndex requis' });
    }

    // Récupérer le contenu pour connaître le nombre total de leçons
    const content = await Content.findOne({
      _id: contentId,
      isTutorial: true,
      isPublished: true
    }).select('lessons');

    if (!content) {
      return res.status(404).json({ message: 'Tutoriel introuvable' });
    }

    const totalLessons = content.lessons?.length || 1;

    // Récupérer ou créer la progression
    let progress = await TutorialProgress.findOne({ userId, contentId });

    if (!progress) {
      progress = new TutorialProgress({ userId, contentId });
    }

    // Ajouter la leçon si elle est complétée et pas déjà dans la liste
    if (completed && !progress.completedLessons.includes(lessonIndex)) {
      progress.completedLessons.push(lessonIndex);
    }

    progress.lastLessonIndex  = lessonIndex;
    progress.percentComplete  = Math.round(
      (progress.completedLessons.length / totalLessons) * 100
    );
    progress.lastUpdatedAt    = new Date();

    await progress.save();

    // TF-TUT-01 : completedLessons: [0], percentComplete calculé
    return res.json({
      completedLessons: progress.completedLessons,
      lastLessonIndex:  progress.lastLessonIndex,
      percentComplete:  progress.percentComplete
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/tutorial/progress — Tutoriels en cours
// ─────────────────────────────────────────────────────────────
const getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Tutoriels en cours (non terminés à 100%)
    const inProgress = await TutorialProgress
      .find({ userId, percentComplete: { $lt: 100 } })
      .populate('contentId', 'title thumbnail type category duration')
      .sort({ lastUpdatedAt: -1 })
      .lean();

    // TF-TUT-04 : tableau trié par lastUpdatedAt desc, thumbnail présent
    return res.json({ inProgress });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateProgress, getProgress };
