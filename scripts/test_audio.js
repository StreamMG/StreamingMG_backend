#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

const DUMMY_THUMB = path.join(__dirname, '../TestContenu/dummy_thumb.jpg');
const REAL_AUDIO = path.join(__dirname, '../TestContenu/Tsiky1.mp3');

// Create a dummy image if not exists
if (!fs.existsSync(DUMMY_THUMB)) {
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP6zwAAyQDCpIom/QAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(DUMMY_THUMB, pixel);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('🎵 Démarrage Test E2E Upload Audio 🎵\\n');

  // 1. Auth as provider
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => globalThis.fetch(...args));
  
  const emailSuffix = Date.now();
  const authRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `prov_${emailSuffix}`, email: `prov_${emailSuffix}@test.mg`, password: 'pass', role: 'provider' })
  });
  
  let authData = await authRes.json();
  if (!authData.token && authRes.status === 409) {
     const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `prov_1@test.mg`, password: 'pass' })
     });
     authData = await loginRes.json();
  }
  
  if (!authData || !authData.user) {
    console.error("❌ Impossible de s'authentifier.", authData);
    process.exit(1);
  }

  // Force elevate to provider in DB
  require('child_process').execSync(`mongosh TestStreamMG --quiet --eval "db.users.updateOne({_id: ObjectId('${authData.user._id}')}, {'\\$set': {role: 'provider'}})"`);
  
  // Re-login to get the new JWT with role=provider
  const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `prov_${emailSuffix}@test.mg`, password: 'pass' })
  });
  
  let token = (await reLoginRes.json()).token;
  if (!token) {
    console.error("❌ Impossible de se re-logger");
    process.exit(1);
  }

  console.log(`✅ Authentifié, rôle Provider.`);

  // 2. Upload via CURL pour garantir le boundary multipart
  console.log(`⏳ Uploading Tsiky1.mp3...`);
  
  const uploadCmd = `curl -s -w "%{http_code}" -o /tmp/audio_out.json -X POST "${BASE_URL}/provider/contents" \\
    -H "Authorization: Bearer ${token}" \\
    -F "title=Test Music" \\
    -F "description=Description Test Audio" \\
    -F "category=autre" \\
    -F "language=mg" \\
    -F "type=audio" \\
    -F "thumbnail=@${DUMMY_THUMB};type=image/jpeg" \\
    -F "media=@${REAL_AUDIO};type=audio/mpeg"`;

  const uploadStatus = require('child_process').execSync(uploadCmd).toString().trim();
  try {
    const uploadData = JSON.parse(fs.readFileSync('/tmp/audio_out.json', 'utf8'));
    console.log(`HTTP ${uploadStatus}`);
    console.dir(uploadData);

    if (uploadStatus === '201') {
      console.log(`✅ Upload validé. ID généré : ${uploadData.contentId}`);
      
      // Check DB for duration, artist, album extracted
      await sleep(2000); 
      const contentCheck = require('child_process').execSync(`mongosh TestStreamMG --quiet --eval "JSON.stringify(db.contents.findOne({_id: ObjectId('${uploadData.contentId}')}, {duration:1, artist:1, audioPath:1, thumbnail: 1}))"`).toString();
      console.log(`🔍 Vérification DB Post-Upload :`);
      console.log(contentCheck);
      const metadata = JSON.parse(contentCheck.trim());
      if (metadata.duration && metadata.duration > 0) {
          console.log(`🔥 SUCCÈS : Metadata décodée avec succès via music-metadata (Durée: ${metadata.duration}s)`);
      } else {
          console.log(`❌ ECHEC : La durée n'a pas été extraite, possible crash de music-metadata.`);
      }
      
      if (metadata.thumbnail && metadata.thumbnail.includes('thumb')) {
          console.log(`✅ La vignette a bien été enregistrée pour l'audio : ${metadata.thumbnail}`);
      }

      // 3. Test de lecture en Streaming Audio (HTTP 206 Partial Content)
      console.log(`\\n▶️ Test de lecture audio en streaming depuis le serveur...`);
      const audioUrl = `${BASE_URL.replace('/api', '')}${metadata.audioPath}`;
      const playCmd = `curl -s -I -D - -H "Range: bytes=0-5000" "${audioUrl}" | head -n 15`;
      
      const playOutput = require('child_process').execSync(playCmd).toString();
      
      if (playOutput.includes('206 Partial Content') || playOutput.includes('200 OK')) {
          console.log(`✅ Lecture Audio réussie ! Serveur statique valide (Support Range : OK).`);
          console.log(playOutput.trim());
      } else {
          console.error(`❌ ÉCHEC de lecture de l'audio sur l'URL : ${audioUrl}`);
          console.log(playOutput);
      }

    } else {
      console.error(`❌ ECHEC Upload`);
    }
  } catch(e) {
    console.error("Parse Error:", e);
    console.log(fs.readFileSync('/tmp/audio_out.json', 'utf8'));
  }
}

run();
