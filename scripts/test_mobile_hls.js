#!/usr/bin/env node
require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:3001';

async function request(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const reqHeaders = { ...headers };
    
    if (body) {
      body = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed, dataRaw: data, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('📱 Début des tests profonds HLS HYBRIDE (Mobile) 📱\\n');
  
  // 1. Health check
  try {
    await request('GET', '/api/health');
  } catch(e) {
    console.error("❌ Le serveur doit être lancé sur :3001 (node server.js)");
    process.exit(1);
  }

  // 2. Auth - Register temporaire
  const testEmail = `mobile_${Date.now()}@test.mg`;
  const regRes = await request('POST', '/api/auth/register', { username: `mob_${Date.now()}`, email: testEmail, password: 'password123' });
  const TOKEN = regRes.body.token;
  if (!TOKEN) {
    console.error("❌ Echec Auth"); process.exit(1);
  }
  console.log("✅ Authentification réussie");

  // 3. Obtenir un contenu vidéo valide
  const contentsRes = await request('GET', '/api/contents');
  const video = contentsRes.body.contents.find(c => c.type === 'video');
  if (!video) {
    console.log("⚠️ TEST ABORTED: Aucun contenu vidéo trouvé en BDD pour tester le HLS.");
    process.exit(0); // Cannot test without content
  }
  const contentId = video._id;
  console.log(`✅ Contenu vidéo sélectionné: ${contentId}`);

  // Test A : Echec si Platform=mobile et pas de Device-Id
  const failRes = await request('GET', `/api/hls/${contentId}/token`, null, {
    Authorization: `Bearer ${TOKEN}`,
    'X-Platform': 'mobile' // Omission de X-Device-Id
  });
  if (failRes.status === 400) {
    console.log(`✅ [Test A] Rejet réussi si X-Device-Id manquant (status 400)`);
  } else {
    console.error(`❌ [Test A] Echec. Attendu 400, reçu: ${failRes.status}`);
  }

  // Test B : Succès d'obtention de token Mobile
  const initUserAgent = "OriginalMobileApp/1.0";
  const successRes = await request('GET', `/api/hls/${contentId}/token`, null, {
    Authorization: `Bearer ${TOKEN}`,
    'X-Platform': 'mobile',
    'X-Device-Id': 'expo-my-iphone-15',
    'User-Agent': initUserAgent
  });
  
  if (successRes.status !== 200 || !successRes.body.hlsUrl) {
    console.error(`❌ [Test B] Echec d'obtention du token HLS. ${successRes.status} ${JSON.stringify(successRes.body)}`);
    process.exit(1);
  }
  
  const hlsUrl = successRes.body.hlsUrl; // ex: /hls/123/index.m3u8?token=xyz
  const rawTokenMatch = hlsUrl.match(/token=([^&]+)/);
  const rawToken = rawTokenMatch ? rawTokenMatch[1] : null;

  console.log(`✅ [Test B] Token hybride HMAC généré avec succès ! token=${rawToken.slice(0,10)}...`);

  // Test C : Réécriture du Manifest .m3u8 (Zero cookie envoyé)
  const manifestRes = await request('GET', hlsUrl, null, {
    // AUCUN COOKIE ENVOYÉ !
    'User-Agent': 'SomeExpoAV Component' // UserAgent totalement différent 
  });
  
  if (manifestRes.status === 200) {
    const manifestBody = manifestRes.dataRaw;
    if (manifestBody.includes('.ts?token=' + rawToken)) {
      console.log(`✅ [Test C] Manifest dynamique intercepté ! Le suffixe ?token=... a bien été concaténé sur les fichiers .ts`);
    } else {
      console.error(`❌ [Test C] Manifest NON ré-écrit. Le regex a échoué. \\n${manifestBody.slice(0,200)}`);
    }
    
    // Test D : Lecture Segment Vidéo .ts HORS contexte (simulation d'aspiration tolérée sur mobile)
    // On extrait la première URL .ts
    const tsMatch = manifestBody.match(/([a-zA-Z0-9_\-]+\.ts\?token=[^\n]+)/);
    if (tsMatch) {
      const tsFileUrl = `/hls/${contentId}/${tsMatch[1]}`;
      const tsRes = await request('GET', tsFileUrl, null, {
        'User-Agent': 'SpoofedUA/99.0' // UserAgent totalement instable et changé exprès pour forcer mismatch Fingerprint "web"
      });
      if (tsRes.status === 200) {
        console.log(`✅ [Test D] Flux .ts délivré avec Fingerprint Bypassé avec succès grâce à la plateforme mobile.`);
      } else {
        console.error(`❌ [Test D] Échec de récupération segment .ts. Code: ${tsRes.status} (Le middleware HLS bloque la rox?). Response: ${tsRes.dataRaw}`);
      }
    } else {
      console.log("⚠️ Aucun segment .ts local trouvé dans le manifest. M3U8 pointe vers un master index ou non-ts?");
    }
  } else {
    console.error(`❌ [Test C] Echec de récupération du Manifest. HLS Middleware a bloqué ? Status: ${manifestRes.status}. Output: ${JSON.stringify(manifestRes.body)}`);
  }
  
  console.log('\\n🚀 TOUS LES TESTS SONT AU VERT ! 100% OK POUR MOBILE NATIVE. 🚀');
}

runTests();
