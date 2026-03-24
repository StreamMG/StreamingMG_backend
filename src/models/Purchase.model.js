// ─────────────────────────────────────────────────────────────
//  models/Purchase.js — Index unique {userId, contentId}
//  Garantit l'idempotence des achats
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
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
  stripePaymentId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0  // en Ariary
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// ── Index unique — Empêche tout double achat ──
// POST /payment/purchase retourne 409 si doublon
purchaseSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
