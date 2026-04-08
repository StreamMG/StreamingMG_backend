const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../src/models/Content.model');
const User = require('../src/models/User.model');

const TEST_CONTENU_DIR = '/media/tsiky-ny-antsa/PROJET/streamMG-backend/TestContenu';

function getRandomThumbnail() {
  const photoDir = path.join(TEST_CONTENU_DIR, 'Photo');
  if (!fs.existsSync(photoDir)) return '/uploads/thumbnails/default.jpg';
  
  const photos = fs.readdirSync(photoDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  if (photos.length === 0) return '/uploads/thumbnails/default.jpg';
  
  const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
  return `/uploads/thumbnails/${randomPhoto}`; // We just fake the path to point to Photo, or just use a dummy
  // Actually since this is just DB data, we can use a dummy string
}

async function runFastSeed() {
  try {
    console.log('🔄 Connexion rapide à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('🗑️  Suppression des contenus...');
    await Content.deleteMany({});

    let provider = await User.findOne({ role: 'provider' });
    if (!provider) {
      provider = await User.create({
        username: 'FastProvider',
        email: 'provider_fast@test.com',
        passwordHash: 'dummy',
        role: 'provider'
      });
    }

    const processFileFast = async (filePath, folder, type, category, isTutorial = false) => {
      const ext = path.extname(filePath).toLowerCase();
      const title = path.basename(filePath, ext);
      
      const content = new Content({
        title,
        description: `Inséré instantanément depuis ${folder}`,
        type,
        category,
        language: 'mg',
        accessType: Math.random() > 0.5 ? 'free' : 'premium',
        thumbnail: getRandomThumbnail(), 
        uploadedBy: provider._id,
        isPublished: true,
        isTutorial,
        duration: Math.floor(Math.random() * 300) + 60, // Durée aléatoire 1-6 min
        viewCount: Math.floor(Math.random() * 1000)
      });

      // Simulation des chemins sans copier de fichiers ni transcoder
      if (type === 'video') {
        content.filePath = `/uploads/private/${title.replace(/\\s/g, '_')}${ext}`;
        // Faux chemin HLS pour que le GET fonctionne
        content.hlsPath = `/hls/fake_${content._id}/index.m3u8`;
      } else if (type === 'audio') {
        content.audioPath = `/uploads/audio/${title.replace(/\\s/g, '_')}${ext}`;
        content.artist = 'Artiste Test';
        content.album = 'Album Test';
      }

      await content.save();
    };

    // Mapping
    const directories = [
      { name: 'Mp3', type: 'audio', category: 'musique-contemporaine' },
      { name: 'Fim', type: 'video', category: 'film' },
      { name: 'ClipAudio', type: 'video', category: 'musique-contemporaine' },
      { name: 'Tuto', type: 'video', category: 'tutoriel', isTutorial: true }
    ];

    let count = 0;
    for (const dir of directories) {
      const fullPath = path.join(TEST_CONTENU_DIR, dir.name);
      if (!fs.existsSync(fullPath)) continue;
      
      const files = fs.readdirSync(fullPath);
      for (const file of files) {
        if (file.startsWith('.')) continue;
        await processFileFast(path.join(fullPath, file), dir.name, dir.type, dir.category, dir.isTutorial);
        count++;
      }
    }

    console.log(`\n⚡ Seed ÉCLAIR terminé ! ${count} contenus virtuels insérés dans la base de données.`);
    process.exit(0);

  } catch (err) {
    console.error('Erreur globale:', err);
    process.exit(1);
  }
}

runFastSeed();
