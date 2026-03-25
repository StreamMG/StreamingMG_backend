/**
 * 🎬 Test de Lecture Vidéo HLS (End-to-End)
 * Simule le comportement d'un lecteur (hls.js / Video.js)
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const HLS_STATIC_URL = `http://localhost:${process.env.PORT || 3001}`;
const GLOBAL_UA = 'Mozilla/5.0 (PlaybackTest)';

async function runPlaybackTest() {
  console.log('🚀 Démarrage du test de lecture HLS...\n');

  try {
    // 1. Connexion
    console.log('🔐 [1/5] Connexion...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    }, {
      headers: { 'User-Agent': GLOBAL_UA }
    });
    const token = loginRes.data.token;
    console.log('✅ Connecté.\n');

    // 2. Utiliser l'ID réel fourni
    const contentId = '69c2b9d9d89cee4957a04be1';
    console.log(`📂 [2/5] Préparation du contenu : ${contentId}\n`);

    // 3. Demander le Token HLS
    console.log('🔐 [3/5] Demande de token HLS...');
    const tokenRes = await axios.get(`${API_URL}/hls/${contentId}/token`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': GLOBAL_UA
      }
    });
    const { hlsUrl } = tokenRes.data;
    console.log(`✅ Token reçu. URL playback : ${hlsUrl}\n`);

    // 4. Charger le manifeste
    console.log('📜 [4/5] Chargement du manifeste .m3u8...');
    const manifestUrl = `${HLS_STATIC_URL}${hlsUrl}`;
    const manifestRes = await axios.get(manifestUrl, {
      headers: { 'User-Agent': GLOBAL_UA }
    });
    
    if (manifestRes.status === 200 && manifestRes.data.includes('#EXTM3U')) {
      console.log('✅ Manifeste chargé (HTTP 200).\n');
    } else {
      throw new Error(`Échec manifest : status ${manifestRes.status}`);
    }

    // 5. Charger un segment
    console.log('📦 [5/5] Chargement d\'un segment .ts...');
    const lines = manifestRes.data.split('\n');
    const segmentLine = lines.find(line => line.endsWith('.ts'));
    
    if (!segmentLine) {
      throw new Error('Aucun segment .ts trouvé dans le manifeste.');
    }

    const hlsToken = hlsUrl.split('token=')[1];
    const segmentUrl = `${HLS_STATIC_URL}/hls/${contentId}/${segmentLine}?token=${hlsToken}`;
    
    const segmentRes = await axios.get(segmentUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': GLOBAL_UA }
    });

    if (segmentRes.status === 200 && segmentRes.data.length > 0) {
      console.log(`✅ Segment chargé : ${segmentRes.data.length} octets.`);
      console.log('\n🎉 TEST DE LECTURE HLS RÉUSSI !');
    } else {
      throw new Error(`Échec segment : status ${segmentRes.status}`);
    }

  } catch (err) {
    console.error('\n❌ ÉCHEC DU TEST :');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

runPlaybackTest();
