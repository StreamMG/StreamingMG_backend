const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Content = require('../src/models/Content.model');
const User = require('../src/models/User.model');
const { transcodeToHls, getVideoDuration } = require('../src/services/ffmpegService');

const TEST_CONTENU_DIR = '/media/tsiky-ny-antsa/PROJET/streamMG-backend/TestContenu';
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure directories exist
['thumbnails', 'private', 'audio', 'hls'].forEach(d => {
  const p = path.join(UPLOADS_DIR, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

function getRandomThumbnail() {
  const photoDir = path.join(TEST_CONTENU_DIR, 'Photo');
  const photos = fs.readdirSync(photoDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
  if (photos.length === 0) throw new Error('Aucune photo trouvée dans TestContenu/Photo');
  const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
  return path.join(photoDir, randomPhoto);
}

function copyFileWithHash(sourcePath, destDir, ext) {
  const hash = crypto.randomBytes(8).toString('hex');
  const filename = `${hash}${ext}`;
  const destPath = path.join(destDir, filename);
  fs.copyFileSync(sourcePath, destPath);
  return { filename, destPath };
}

async function runSeed() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('🗑️  Suppression des anciens contenus...');
    await Content.deleteMany({});
    
    console.log("🧹 Nettoyage des dossiers d'upload...");
    ['thumbnails', 'private', 'audio', 'hls'].forEach(d => {
      const p = path.join(UPLOADS_DIR, d);
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
        fs.mkdirSync(p, { recursive: true });
      }
    });

    let provider = await User.findOne({ role: 'provider' });
    if (!provider) {
      provider = await User.create({
        username: 'SeederProvider',
        email: 'provider_seed@test.com',
        passwordHash: 'dummy',
        role: 'provider'
      });
    }

    const processFile = async (filePath, folder, type, category, isTutorial = false) => {
      const ext = path.extname(filePath).toLowerCase();
      const title = path.basename(filePath, ext);
      
      console.log(`\n📄 Traitement de: ${title} (${type})`);

      // 1. Copier la vignette
      const thumbSource = getRandomThumbnail();
      const thumbDestName = crypto.randomBytes(8).toString('hex') + path.extname(thumbSource);
      const thumbDestPath = path.join(UPLOADS_DIR, 'thumbnails', thumbDestName);
      fs.copyFileSync(thumbSource, thumbDestPath);

      // 2. Préparer le document de base
      const content = new Content({
        title,
        description: `Contenu de test issu de ${folder}`,
        type,
        category,
        language: 'mg',
        accessType: Math.random() > 0.5 ? 'free' : 'premium', // Random access type
        thumbnail: `/uploads/thumbnails/${thumbDestName}`,
        uploadedBy: provider._id,
        isPublished: true,
        isTutorial
      });

      await content.save();

      // 3. Traiter le média
      if (type === 'video') {
        const { filename, destPath } = copyFileWithHash(filePath, path.join(UPLOADS_DIR, 'private'), ext);
        content.filePath = `/uploads/private/${filename}`;
        
        try {
          // Attendre la durée
          const duration = await getVideoDuration(destPath).catch(() => 0);
          content.duration = duration;
          await content.save();
          
          console.log(`🎬 Transcodage HLS en cours pour ${title}...`);
          const hlsPath = await transcodeToHls(destPath, content._id.toString());
          content.hlsPath = hlsPath;
          await content.save();
          console.log(`✅ Vidéo terminée et publiée: ${title}`);
        } catch (err) {
          console.error(`❌ Erreur de transcodage pour ${title}:`, err.message);
          content.isPublished = false;
          await content.save();
        }
      } else if (type === 'audio') {
        const { filename, destPath } = copyFileWithHash(filePath, path.join(UPLOADS_DIR, 'audio'), ext);
        content.audioPath = `/uploads/audio/${filename}`;
        
        try {
          const mm = await import('music-metadata');
          const metadata = await mm.parseFile(destPath);
          content.duration = Math.floor(metadata.format.duration || 0);
          content.artist = metadata.common.artist || null;
          content.album = metadata.common.album || null;
        } catch (e) {
          content.duration = 0;
        }
        await content.save();
        console.log(`✅ Audio terminé et publié: ${title}`);
      }
    };

    // Mapping des dossiers
    const directories = [
      { name: 'Mp3', type: 'audio', category: 'musique-contemporaine' },
      { name: 'Fim', type: 'video', category: 'film' },
      { name: 'ClipAudio', type: 'video', category: 'musique-contemporaine' },
      { name: 'Tuto', type: 'video', category: 'tutoriel', isTutorial: true }
    ];

    for (const dir of directories) {
      const fullPath = path.join(TEST_CONTENU_DIR, dir.name);
      if (!fs.existsSync(fullPath)) continue;
      
      const files = fs.readdirSync(fullPath);
      for (const file of files) {
        if (file.startsWith('.')) continue; // ignore hidden files
        await processFile(path.join(fullPath, file), dir.name, dir.type, dir.category, dir.isTutorial);
      }
    }

    console.log('\n🎉 Seed complet ! Tous les fichiers ont été intégrés dans MongoDB.');
    process.exit(0);

  } catch (err) {
    console.error('Erreur globale:', err);
    process.exit(1);
  }
}

runSeed();
