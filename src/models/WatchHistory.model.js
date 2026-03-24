// ─────────────────────────────────────────────────────────────
//  models/WatchHistory.js — Historique de visionnage
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
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
  watchedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0   // secondes regardées
  },
  completed: {
    type: Boolean,
    default: false   // true si > 90% de la durée
  }
}, {
  timestamps: false
});

// ── Index ──
watchHistorySchema.index({ userId: 1, watchedAt: -1 });     // tri chronologique
watchHistorySchema.index({ userId: 1, contentId: 1 });      // mise à jour progression

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
