// ─────────────────────────────────────────────────────────────
//  models/RefreshToken.js — TTL index auto-purge à expiration
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true
    // ⚠️ Hash bcrypt — jamais le token brut en DB
  },
  expiresAt: {
    type: Date,
    required: true
    // MongoDB supprime automatiquement via TTL index
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// ── TTL Index — Suppression automatique à expiration ──
// expireAfterSeconds: 0 → MongoDB supprime dès que expiresAt est dépassé
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
