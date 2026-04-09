#!/usr/bin/env node
require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:3001';
const MOCK_BASE = 'http://localhost:3002';

async function request(method, urlPath, base, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, base);
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runTests() {
  console.log('💳 ── SIMULATION STRIPE END-TO-END ── 💳\\n');

  try { await request('GET', '/api/health', BASE); } catch {
    console.error("❌ Le serveur backend principal n'est pas lancé (:3001). Lancez node server.js"); process.exit(1);
  }

  // Auth - Create temporary user
  const email = `stripe_${Date.now()}@test.mg`;
  const regRes = await request('POST', '/api/auth/register', BASE, { 
    username: `usr_${Date.now()}`, email, password: 'password123' 
  });
  const TOKEN = regRes.body.token;
  if (!TOKEN) { console.error("❌ Echec Auth"); process.exit(1); }
  console.log("✅ Authentification réussie (Utilisateur Test).");

  // TEST 1: ABONNEMENT PREMIUM
  console.log("\\n-- 1. Simulation Abonnement Mensuel Premium --");
  const subRes = await request('POST', '/api/payment/subscribe', BASE, { plan: 'monthly' }, { Authorization: `Bearer ${TOKEN}` });
  
  if (subRes.status !== 200 || !subRes.body.clientSecret) {
    console.error(`❌ Échec de la création du PaymentIntent. ${subRes.status} ${JSON.stringify(subRes.body)}`); process.exit(1);
  }
  console.log(`✅ PaymentIntent créé via Mock Stripe : ${subRes.body.clientSecret}`);

  // Simuler le Webhook
  const pi_id = subRes.body.clientSecret.split('_secret_')[0];
  const whRes = await request('POST', '/trigger-webhook', MOCK_BASE, {
    paymentIntentId: pi_id,
    amount: 500000,
    metadata: { type: 'subscription', plan: 'monthly', userId: regRes.body.user._id }
  });
  if (whRes.status !== 200 || whRes.body.backendStatus !== 200) {
    console.error(`❌ Échec du webhook. Status: ${whRes.body?.backendStatus}`); process.exit(1);
  }
  console.log(`✅ Webhook payment_intent.succeeded transmis à 3001/api/payment/webhook !`);

  // Vérifier le statut de l'utilisateur
  await sleep(100); // Wait for async propagation
  const statusRes = await request('GET', '/api/payment/status', BASE, null, { Authorization: `Bearer ${TOKEN}` });
  if (statusRes.body.isPremium) {
    console.log(`✅ L'utilisateur est DÉSORMAIS Premium jusqu'au ${statusRes.body.premiumExpiry} ! RÈGLE-08 (Webhook) Validée.`);
  } else {
    console.error("❌ Le webhook n'a pas actualisé la base de données de l'utilisateur."); process.exit(1);
  }

  // TEST 2: ACHAT UNITAIRE (Idempotence)
  console.log("\\n-- 2. Simulation Achat Unitaire (Contenu Payant) --");
  const contentId = "69c797ee53cfb67592f4491a"; // Seeded 'paid' content in the DB
  const purRes = await request('POST', '/api/payment/purchase', BASE, { contentId }, { Authorization: `Bearer ${TOKEN}` });
  
  if (purRes.status !== 200 || !purRes.body.clientSecret) {
    console.error(`❌ Échec de création d'achat. Status: ${purRes.status}. Output: ${JSON.stringify(purRes.body)}`); process.exit(1);
  }
  console.log(`✅ PaymentIntent (Purchase) créé via Mock Stripe : ${purRes.body.clientSecret}`);

  const pur_pi_id = purRes.body.clientSecret.split('_secret_')[0];
  const whPurRes = await request('POST', '/trigger-webhook', MOCK_BASE, {
    paymentIntentId: pur_pi_id,
    amount: 300000,
    metadata: { type: 'purchase', contentId, userId: regRes.body.user._id }
  });
  if (whPurRes.status !== 200 || whPurRes.body.backendStatus !== 200) {
    console.error(`❌ Échec webhook Achat Unit. Status: ${whPurRes.body?.backendStatus}`); process.exit(1);
  }
  console.log(`✅ Webhook Achat enregistré avec succès !`);

  // Vérifier Idempotence
  await sleep(100);
  const dupPurRes = await request('POST', '/api/payment/purchase', BASE, { contentId }, { Authorization: `Bearer ${TOKEN}` });
  if (dupPurRes.status === 409) {
    console.log(`✅ RÈGLE-09 VALIDÉE: L'idempotence a rejeté l'achat en doublon avec une erreur 409 (Conflict).`);
  } else {
    console.error(`❌ L'idempotence a échoué. Le backend a retourné: ${dupPurRes.status}.`); process.exit(1);
  }

  // Vérifier la liste des achats
  const listRes = await request('GET', '/api/payment/purchases', BASE, null, { Authorization: `Bearer ${TOKEN}` });
  if (listRes.status === 200 && listRes.body.purchases.length > 0) {
    console.log(`✅ L'achat apparaît bien dans l'historique GET /api/payment/purchases !`);
  } else {
    console.error(`❌ L'achat est manquant dans la liste des achats.`); process.exit(1);
  }

  console.log("\\n🔥 TOUS LES TESTS STRIPE SONT PARFAITS. PIPELINE BACKEND VALIDEE À 100% 🔥\\n");
}

runTests();
