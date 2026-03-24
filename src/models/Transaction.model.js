// ─────────────────────────────────────────────────────────────
//  models/Transaction.js — Historique des paiements Stripe
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['subscription', 'purchase'],
    required: true
  },
  stripePaymentId: {
    type: String,
    required: true,
    unique: true   // Anti-doublon webhook
  },
  amount: {
    type: Number,
    required: true   // en Ariary
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly', null],
    default: null    // null pour les achats unitaires
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    default: null    // null pour les abonnements
  },
  status: {
    type: String,
    enum: ['succeeded', 'failed'],
    default: 'succeeded'
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

transactionSchema.index({ userId: 1, createdAt: -1 });
// stripePaymentId unique géré dans le schéma

module.exports = mongoose.model('Transaction', transactionSchema);
