// ─────────────────────────────────────────────────────────────
//  models/User.js — Collection `users`
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit faire au moins 3 caractères'],
    maxlength: [30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Format email invalide']
  },
  passwordHash: {
    type: String,
    required: true,
    select: false   // Jamais retourné au client par défaut
  },
  role: {
    type: String,
    enum: ['user', 'premium', 'provider', 'admin'],
    default: 'user'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiry: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // createdAt, updatedAt automatiques
});

// ── Index ──
// email index géré par unique:true dans le schéma
userSchema.index({ role: 1 });

// ── Méthode utilitaire — retourne l'objet sans passwordHash ──
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
