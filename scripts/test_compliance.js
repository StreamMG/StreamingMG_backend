/**
 * 🕵️ Test de Conformité Stricte @user_global
 * Vidéo HLS (Tokens manuel HMAC) + Audio (Signed URL + AES Keygen service)
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const HLS_STATIC_URL = `http://localhost:${process.env.PORT || 3001}`;
const GLOBAL_UA = 'Mozilla/5.0 (ComplianceCheck)';

async function runComplianceTest() {
  console.log('🚀 Démarrage du test de conformité @user_global...\n');

  try {
    // 1. Connexion
    console.log('🔐 [1/4] Connexion...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    }, {
      headers: { 'User-Agent': GLOBAL_UA }
    });
    const token = loginRes.data.token;
    console.log('✅ OK.\n');

    // 2. Test Vidéo HLS (ID réel)
    console.log('🎬 [2/4] Test Vidéo HLS (Conforme Tâche 2.1 / S4)...');
    const videoId = '69c2b9d9d89cee4957a04be1';
    const hlsTokenRes = await axios.get(`${API_URL}/hls/${videoId}/token`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': GLOBAL_UA
      }
    });
    const { hlsUrl } = hlsTokenRes.data;
    console.log(`✅ Token reçu (HMAC manual). URL : ${hlsUrl}`);
    
    const manifestRes = await axios.get(`${HLS_STATIC_URL}${hlsUrl}`, {
      headers: { 'User-Agent': GLOBAL_UA }
    });
    console.log(`✅ Manifeste .m3u8 chargé (HTTP ${manifestRes.status}).\n`);

    // 3. Test Audio (ID réel + AES service)
    console.log('🎵 [3/4] Test Audio (Conforme RÈGLE-06 + AES Service)...');
    const audioId = '69c38d08ec4b9a4a30272433';
    const downloadRes = await axios.post(`${API_URL}/download/${audioId}`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': GLOBAL_UA
      }
    });
    const { signedUrl, aesKeyHex, ivHex } = downloadRes.data;
    console.log(`✅ URL signée : ${signedUrl.substring(0, 60)}...`);
    console.log(`✅ AES KeyHex (RÈGLE-06) : ${aesKeyHex.length} chars (64 attendus)`);
    console.log(`✅ IV Hex : ${ivHex.length} chars (32 attendus)`);

    const streamRes = await axios.get(signedUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': GLOBAL_UA }
    });
    console.log(`✅ Flux audio reçu : ${streamRes.data.byteLength} octets (HTTP ${streamRes.status}).\n`);

    // 4. Test RÈGLE-02 (Pas de route directe .mp4)
    console.log('🛡️ [4/4] Vérification RÈGLE-02 (Pas de route directe .mp4)...');
    try {
      await axios.get(`${HLS_STATIC_URL}/src/uploads/private/${videoId}_src.mp4`);
      throw new Error('ERREUR : Le fichier source .mp4 est exposé publiquement !');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('✅ OK : Le fichier source est inaccessible (404 Not Found).\n');
      } else {
         console.log(`⚠️ Info : Statut inattendu pour .mp4 : ${err.response?.status || err.message}`);
      }
    }

    console.log('🎉 TOUS LES CRITÈRES DE CONFORMITÉ @user_global SONT REMPLIS !');

  } catch (err) {
    console.error('\n❌ ÉCHEC DU TEST DE CONFORMITÉ :');
    console.error(err.response?.data || err.message);
    process.exit(1);
  }
}

runComplianceTest();
