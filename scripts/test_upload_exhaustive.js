const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'http://127.0.0.1:3001/api';
const EMAIL = `prov_test_${Date.now()}@test.mg`;
const PASSWORD = 'Password123!';
const USERNAME = `ProvTester_${Date.now()}`;

// Dossier temporaire pour les dummies
const TMP_DIR = path.join(__dirname, '../TestContenuTmp');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// 1. DUMMY CREATION
console.log('🎬 1. Génération des fichiers de test (Assets)...');
const DUMMY_IMG = path.join(TMP_DIR, 'fake_thumb.jpg');
const DUMMY_VID = path.join(TMP_DIR, 'fake_video.mp4');
const DUMMY_BAD = path.join(TMP_DIR, 'fake_virus.exe');

// Create dummy image if not exists
if (!fs.existsSync(DUMMY_IMG)) fs.writeFileSync(DUMMY_IMG, 'FAKE_IMAGE_DATA');
// Create dummy video (Text masquerading as mp4 for basic multer size checks or real tiny mp4 if needed. Since Multer checks MIME or extension, a text file branded as mp4 passes the name check, but let's just make an empty file)
if (!fs.existsSync(DUMMY_VID)) fs.writeFileSync(DUMMY_VID, 'FAKE_VIDEO_DATA_MP4_FORMAT');
if (!fs.existsSync(DUMMY_BAD)) fs.writeFileSync(DUMMY_BAD, 'MZ_VIRUS_FORMAT');

let token = '';

const simulateUpload = async (scenarioName, config, expectedStatusCode) => {
  const form = new FormData();
  
  if (config.fields) {
    for (const [k, v] of Object.entries(config.fields)) {
      form.append(k, v);
    }
  }

  if (config.thumbnail) {
    form.append('thumbnail', fs.createReadStream(config.thumbnail));
  }
  if (config.media) {
    if (config.media.path) {
      form.append('media', fs.createReadStream(config.media.path), {
         filename: config.media.filename || 'video.mp4',
         contentType: config.media.mime || 'video/mp4'
      });
    } else {
      form.append('media', fs.createReadStream(config.media));
    }
  }

  try {
    const res = await axios.post(`${BASE_URL}/provider/contents`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true // Resolve on ALL status codes to inspect them
    });

    const passed = res.status === expectedStatusCode;
    console.log(`[${passed ? '✅' : '❌'}] SCÉNARIO: ${scenarioName}`);
    console.log(`   └─ Attendu: HTTP ${expectedStatusCode} | Obtenu: HTTP ${res.status}`);
    if (!passed || res.status !== 200 && res.status !== 201) {
       let msg = res.data?.message || JSON.stringify(res.data) || res.statusText;
       msg = msg.substring(0, 100); // truncate
       if (passed) {
          console.log(`   └─ Refus légitime du serveur : ${msg}`);
       } else {
          console.log(`   └─ Détail : ${msg}`);
       }
    }
  } catch (err) {
    console.log(`[❌] SCÉNARIO: ${scenarioName} - Crash : ${err.message}`);
  }
};

async function runAll() {
  console.log('\n🔐 2. Bootstrap Account Provider...');
  await axios.post(`${BASE_URL}/auth/register`, { username: USERNAME, email: EMAIL, password: PASSWORD });
  // Set role provider manually via direct mongo? Wait, register makes "user".
  // Let's rely on the previous admin or DB, or just note that if it's "user", provider route gives 403.
  // Wait, if register = user, we might get 403. Let's patch DB for this test script dynamically if possible.
  console.log('   (Tentative passative Admin/Provider...)');
  // Hack: register an admin user if not blocked by logic to elevate! Or directly test against provider auth.
  let lRes = await axios.post(`${BASE_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
  token = lRes.data.token;
  
  // Can we run a quick mongo update?
  try {
    execSync(`mongosh TestStreamMG --eval 'db.users.updateOne({email: "${EMAIL}"}, {$set: {role: "provider"}})'`);
    console.log('   └─ Elevation Provider réussie par mongo !');
    // Refresh token after role change
    let rRes = await axios.post(`${BASE_URL}/auth/login`, { email: EMAIL, password: PASSWORD });
    token = rRes.data.token;
  } catch(e) {
    console.log('   └─ Cannot auto-elevate. Scenario tests might just return 403! ' + e.message);
  }

  const baseFields = {
    title: 'Integration Test V2',
    description: 'Testing the entire boundary',
    category: 'film',
    language: 'mg',
    type: 'video'
  };

  console.log('\n🧪 3. Exécution de tous les scénarios d\'Upload');
  
  await simulateUpload('1. SUCCESS STANDARD', {
    fields: baseFields,
    thumbnail: DUMMY_IMG,
    media: DUMMY_VID
  }, 201);

  await simulateUpload('2. FAIL - Manque Thumbnail (RÈGLE-03)', {
    fields: baseFields,
    media: DUMMY_VID
  }, 400);

  await simulateUpload('3. FAIL - Manque Media Principal', {
    fields: baseFields,
    thumbnail: DUMMY_IMG
  }, 400);

  await simulateUpload('4. FAIL - Fichier Media Refusé (Mauvais Format)', {
    fields: baseFields,
    thumbnail: DUMMY_IMG,
    media: { path: DUMMY_BAD, filename: 'virus.exe', mime: 'application/x-msdownload' }
  }, 400); // Should be 400 or 415 or 422 depending on implementation of multer limit/filter

  await simulateUpload('5. FAIL - Champs Requis Manquants (ex: title)', {
    fields: { description: 'Missing title', category: 'film' },
    thumbnail: DUMMY_IMG,
    media: DUMMY_VID
  }, 400);

  console.log('\n🧹 4. Nettoyage...');
  fs.unlinkSync(DUMMY_IMG);
  fs.unlinkSync(DUMMY_VID);
  fs.unlinkSync(DUMMY_BAD);
  fs.rmdirSync(TMP_DIR);
  console.log('✅ Cycle E2E Terminé.');
}

runAll();
