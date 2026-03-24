// ─────────────────────────────────────────────────────────────
//  models/Playlist.js — Playlists utilisateur
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Le nom de la playlist est requis'],
    trim: true,
    maxlength: [100, 'Nom trop long']
  },
  contents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

playlistSchema.index({ userId: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
