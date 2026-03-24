const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';
const EMAIL = 'provider@test.com';
const PASSWORD = 'password123';

const SOURCE_DIR = '/media/tsiky-ny-antsa/PROJET/streamMG-backend/TestContenu';
const THUMBNAIL_PATH = path.join(__dirname, '../uploads/thumbnails/test-video.jpg');

const testCases = [
  {
    name: 'Test Audio (Extraction Métadonnées)',
    file: path.join(SOURCE_DIR, 'Mp3/Revirevinay taloha.mp3'),
    meta: {
      title: 'Revirevinay taloha',
      type: 'audio',
      category: 'podcast',
      description:'azezrzlejflkefjl'
    }
  },
  {
    name: 'Test Clip Vidéo (HLS lent)',
    file: path.join(SOURCE_DIR, 'ClipAudio/NF - FEAR.mp4'),
    meta: {
      title: 'NF - FEAR',
      type: 'video',
      category: 'salegy',
      description:'azezrzlejflkefjl'
    }
  },
  {
    name: 'Test Film (Gros fichier)',
    file: path.join(SOURCE_DIR, 'ClipAudio/Lewis Capaldi - Someone You Loved.mp4'),
    meta: {
      title: 'Lewis Movie',
      type: 'video',
      category: 'film',
      description:'azezrzlejflkefjl'
    }
  },
  {
    name: 'Test Tutoriel (Option isTutorial)',
    file: path.join(SOURCE_DIR, "ClipAudio/John Legend - All of Me (Official Video).mp4"),
    meta: {
      title: 'Tuto Qt - Chap 1',
      type: 'video',
      category: 'tutoriel',
      isTutorial: 'true',
      description:'azezrzlejflkefjl'
    }
  }
];

async function run() {
  console.log('=== DÉBUT DU TEST RÉEL ===');
  try {
    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
    const token = loginRes.data.token;
    console.log('✅ Auth Réussie, token obtenu.');

    for (const t of testCases) {
      console.log(`\n⏳ Exécution: ${t.name}`);
      console.log(`   Source: ${t.file}`);
      
      if (!fs.existsSync(t.file)) {
        console.log(`❌ Fichier introuvable, test ignoré.`);
        continue;
      }

      const form = new FormData();
      form.append('title', t.meta.title);
      form.append('type', t.meta.type);
      form.append('category', t.meta.category);
      form.append('description', t.meta.description || 'Description test');
      if (t.meta.isTutorial) form.append('isTutorial', t.meta.isTutorial);
      
      // Mandatory thumbnail
      form.append('thumbnail', fs.createReadStream(THUMBNAIL_PATH));
      // Media
      form.append('media', fs.createReadStream(t.file));

      try {
        const start = Date.now();
        const res = await axios.post(`${BASE_URL}/provider/contents`, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        });
        const elapsed = Date.now() - start;
        console.log(`   ✅ Succès en ${elapsed}ms -> contentId: ${res.data.contentId}`);
      } catch (e) {
        console.log(`   ❌ Erreur API: ${e.response?.data?.message || e.message}`);
      }
    }
    console.log('\n=== FIN DU TEST ===');
  } catch (err) {
    console.error('Erreur Critique:', err.message);
  }
}

run();
