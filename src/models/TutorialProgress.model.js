// ─────────────────────────────────────────────────────────────
//  models/TutorialProgress.js — Progression par leçon
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const tutorialProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  completedLessons: {
    type: [Number],
    default: []   // ex: [0, 1, 3] — indices des leçons terminées
  },
  lastLessonIndex: {
    type: Number,
    default: 0
  },
  percentComplete: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
    // Calculé : completedLessons.length / totalLessons * 100
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// ── Index unique — upsert sur progression ──
tutorialProgressSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('TutorialProgress', tutorialProgressSchema);
