/**
 * 🎵 Test de Lecture Audio (Streaming via Signed URL)
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;
const GLOBAL_UA = 'Mozilla/5.0 (PlaybackTest)';

async function runAudioPlaybackTest() {
  console.log('🚀 Démarrage du test de lecture Audio...\n');

  try {
    // 1. Connexion (Admin pour bypass checkAccess ou simuler un user autorisé)
    console.log('🔐 [1/4] Connexion...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    }, {
      headers: { 'User-Agent': GLOBAL_UA }
    });
    const token = loginRes.data.token;
    console.log('✅ Connecté.\n');

    // 2. Demander une URL signée pour le contenu audio
    const contentId = '69c38d08ec4b9a4a30272433';
    console.log(`📡 [2/4] Demande d'URL signée pour : ${contentId}...`);
    
    // Note: La route est POST /api/download/:contentId
    const downloadRes = await axios.post(`${API_URL}/download/${contentId}`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': GLOBAL_UA
      }
    });

    const { signedUrl, aesKeyHex } = downloadRes.data;
    console.log(`✅ URL signée reçue. (AES Key: ${aesKeyHex ? 'Présente' : 'Absente'})\n`);
    console.log(`🔗 URL : ${signedUrl}\n`);

    // 3. Charger le fichier via l'URL signée
    console.log('🎧 [3/4] Accès au stream audio...');
    // L'URL signée est absolue (http://localhost:3001/private/...)
    const streamRes = await axios.get(signedUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': GLOBAL_UA }
    });

    if (streamRes.status === 200 || streamRes.status === 206) {
      console.log(`✅ Fichier audio reçu : ${streamRes.data.byteLength} octets.`);
      console.log(`✅ Type MIME : ${streamRes.headers['content-type']}`);
    } else {
      throw new Error(`Échec stream : status ${streamRes.status}`);
    }

    // 4. Test d'accès direct statique (pour vérifier le bypass)
    console.log('\n🔍 [4/4] Test accès statique direct (optionnel)...');
    const staticUrl = `${BASE_URL}/uploads/audio/4a618355f70f5895.mp3`;
    try {
      const staticRes = await axios.head(staticUrl);
      console.log(`⚠️ Note : Le fichier est accessible en statique direct (HTTP ${staticRes.status}).`);
    } catch {
      console.log(`✅ Succès : Le fichier est caché en statique direct.`);
    }

    console.log('\n🎉 TEST DE LECTURE AUDIO RÉUSSI !');

  } catch (err) {
    console.error('\n❌ ÉCHEC DU TEST AUDIO :');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

runAudioPlaybackTest();
