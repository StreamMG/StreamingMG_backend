require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ajuster le require selon la structure qu'on vient de refaire !
const connectDB = require('../src/config/database');
const User = require('../src/models/User.model');
const Content = require('../src/models/Content.model');

async function seed() {
  try {
    console.log('Connexion à la BDD...');
    await connectDB();
    
    console.log('Vidage des collections...');
    try { await User.collection.drop(); } catch (e) {}
    try { await Content.collection.drop(); } catch (e) {}
    await User.init();
    await Content.init();
    
    // Hash générique
    const passwordHash = await bcrypt.hash('password123', 12);
    
    console.log('Création des utilisateurs...');
    const admin = await User.create({ username: 'admin', email: 'admin@test.com', passwordHash, role: 'admin' });
    const provider = await User.create({ username: 'provider', email: 'provider@test.com', passwordHash, role: 'provider' });
    const premium = await User.create({ username: 'premium', email: 'premium@test.com', passwordHash, role: 'premium', isPremium: true, premiumExpiry: new Date(Date.now() + 30*86400000) });
    const user = await User.create({ username: 'user', email: 'user@test.com', passwordHash, role: 'user' });
    
    console.log('Création du contenu Vidéo...');
    await Content.create({
      title: 'Vidéo de Test',
      description: 'Une courte vidéo générée avec ffmpeg.',
      type: 'video',
      category: 'film',
      language: 'fr',
      thumbnail: '/uploads/thumbnails/test-video.jpg',
      filePath: '/uploads/private/test-video.mp4', 
      hlsPath: null, // Pas encore converti en HLS
      duration: 10,
      accessType: 'free',
      uploadedBy: provider._id,
      isPublished: true
    });
    
    console.log('Création du contenu Audio...');
    await Content.create({
      title: 'Audio de Test',
      description: 'Un court fichier audio généré avec ffmpeg.',
      type: 'audio',
      category: 'podcast',
      language: 'mg',
      thumbnail: '/uploads/thumbnails/test-audio.jpg',
      audioPath: '/uploads/audio/test-audio.mp3',
      filePath: '/uploads/audio/test-audio.mp3',
      duration: 10,
      accessType: 'free',
      uploadedBy: provider._id,
      isPublished: true
    });

    console.log('✅ Seeding terminé avec succès.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur durant le seeding:', error);
    process.exit(1);
  }
}

seed();
