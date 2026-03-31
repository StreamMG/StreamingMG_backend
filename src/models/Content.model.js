const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  order:       { type: Number, required: true, min: 1 },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  thumbnail:   { type: String, default: null },
  filePath:    { type: String, required: true },
  hlsPath:     { type: String, default: null },
  duration:    { type: Number, required: true },
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  // Communs
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type:        { type: String, required: true, enum: ['video', 'audio'] },
  category:    { 
    type: String, 
    required: true,
    enum: ['film','salegy','hira-gasy','tsapiky','beko','documentaire','podcast','tutoriel','musique-contemporaine','autre'] 
  },
  subCategory: { type: String, default: null },
  language:    { type: String, required: true, enum: ['mg', 'fr', 'bilingual'] },

  // ★ OBLIGATOIRE
  thumbnail:   { type: String, required: true },

  // Fichiers
  filePath:    { type: String, default: null },
  hlsPath:     { type: String, default: null },
  audioPath:   { type: String, default: null },
  fileSize:    { type: Number, default: 0 },
  mimeType:    { type: String, default: null },
  duration:    { type: Number, default: null },

  // Modèle économique
  accessType:  { type: String, enum: ['free','premium','paid'], default: 'free' },
  price: {
    type: Number, 
    default: null,
    validate: {
      validator(v) { return this.accessType !== 'paid' || (v !== null && v > 0); },
      message: 'price obligatoire et > 0 pour les contenus payants',
    },
  },

  // Méta
  viewCount:   { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Spécifiques AUDIO
  artist:      { type: String, default: null },
  album:       { type: String, default: null },
  coverArt:    { type: String, default: null },
  trackNumber: { type: Number, default: null },

  // Spécifiques VIDEO
  resolution:  { type: String, default: null },
  director:    { type: String, default: null },
  cast:        [String],
  subtitles:   [{ language: String, filePath: String }],

  // Tutoriels
  isTutorial:  { type: Boolean, default: false },
  lessons:     [LessonSchema],

}, { timestamps: true });

// Index requis selon le cahier des charges
ContentSchema.index({ title: 'text', artist: 'text', description: 'text' }, { language_override: 'dummy_lang' });
ContentSchema.index({ category: 1 });
ContentSchema.index({ type: 1 });
ContentSchema.index({ accessType: 1 });
ContentSchema.index({ viewCount: -1 });
ContentSchema.index({ uploadedBy: 1 });
ContentSchema.index({ isPublished: 1 });
ContentSchema.index({ isTutorial: 1 });

module.exports = mongoose.model('Content', ContentSchema);
