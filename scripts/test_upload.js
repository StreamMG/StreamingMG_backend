const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration - Utilisez 127.0.0.1 pour éviter les délais DNS de localhost sur Windows
const BASE_URL = 'http://127.0.0.1:3001/api'; 
const EMAIL = 'provider@test.com';
const PASSWORD = 'password123';

// Chemins absolus Windows
const SOURCE_DIR = "D:\\StreamingMG_backend\\TestContenu\\ClipAudio";
const THUMBNAIL_PATH = path.join(__dirname, '../uploads/thumbnails/test-video.jpg');

const testCases = [
  {
    name: 'Afindrafindrao (Salegy/Piano)',
    filename: '1.mp4',
    meta: {
      title: 'Afindrafindrao - Piano',
      category: 'salegy',
      description: 'Test upload piano malagasy'
    }
  },
  {
    name: 'AGRAD (Film/Gros fichier)',
    filename: '4.mp4',
    meta: {
      title: 'AGRAD - Zanaki Dadanay',
      category: 'film',
      description: 'Test upload gros fichier 4K'
    }
  },
  {
    name: 'AmbondronA (Tutoriel - Tomany)',
    filename: '2.mp4',
    meta: {
      title: 'Tuto Rock - Chap 1',
      category: 'tutoriel',
      isTutorial: 'true',
      description: 'Apprendre le rock malagasy'
    }
  },
  {
    name: 'AmbondronA (Tutoriel - Aza ela)',
    filename: '3.mp4',
    meta: {
      title: 'Tuto Rock - Chap 2',
      category: 'tutoriel',
      isTutorial: 'true',
      description: 'Suite du cours de rock'
    }
  },
  {
    name: 'Ho avy ilay malala (Salegy)',
    filename: '5.mp4',
    meta: {
      title: 'Ho avy ilay malala',
      category: 'salegy',
      description: 'Variété malagasy test'
    }
  }
];

async function run() {
  console.log('🚀 === DÉBUT DE L\'UPLOAD DE TEST (MODE PUBLIC) ===');
  
  try {
    // 1. Authentification pour obtenir le Token
    console.log('🔐 Tentative de connexion...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { 
      email: EMAIL, 
      password: PASSWORD 
    });
    
    const token = loginRes.data.token;
    console.log('✅ Authentification réussie.\n');

    for (const t of testCases) {
      const filePath = path.join(SOURCE_DIR, t.filename);
      console.log(`--------------------------------------------------`);
      console.log(`📦 Traitement : ${t.name}`);

      // Vérification physique du fichier
      if (!fs.existsSync(filePath)) {
        console.log(`❌ ERREUR : Fichier introuvable sur le disque.`);
        console.log(`   Chemin testé : ${filePath}`);
        continue;
      }

      // Calcul de la taille réelle pour la base de données
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      const form = new FormData();
      form.append('title', t.meta.title);
      form.append('type', 'video');
      form.append('category', t.meta.category);
      form.append('description', t.meta.description);
      form.append('isPublished', 'true'); // On force la publication dès l'upload
      form.append('fileSize', fileSize.toString());
      
      if (t.meta.isTutorial) {
        form.append('isTutorial', 'true');
      }

      // Streams de fichiers
      form.append('thumbnail', fs.createReadStream(THUMBNAIL_PATH));
      form.append('media', fs.createReadStream(filePath));

      try {
        const startTime = Date.now();
        const response = await axios.post(`${BASE_URL}/provider/contents`, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${token}`
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          // Timeout long pour les gros fichiers
          timeout: 600000 
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Succès ! ID: ${response.data.contentId} (${duration}s)`);
        console.log(`📊 Taille : ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

      } catch (uploadError) {
        const errorMsg = uploadError.response?.data?.message || uploadError.message;
        console.log(`❌ Erreur API lors de l'upload : ${errorMsg}`);
      }
    }

    console.log(`\n==================================================`);
    console.log(`🏁 FIN DES TESTS. Vérifiez votre Dashboard Front-end.`);
    console.log(`==================================================`);

  } catch (authError) {
    console.error('💥 ERREUR CRITIQUE (Auth) :', authError.response?.data || authError.message);
    console.log('\nCONSEIL : Vérifiez que votre serveur Node (Express) est bien lancé sur le port 3001.');
  }
}

run();