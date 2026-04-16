const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001/api';
const RAW_BASE = 'http://localhost:3001';

const results = [];
function addResult(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`[${pass ? '✅' : '❌'}] ${name} | ${detail}`);
}

async function fetchHttp(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(path.startsWith('http') ? path : BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers
    };

    if (body) {
      if (typeof body === 'object') body = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(body);
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', (err) => resolve({ status: 500, body: err.message }));
    if (body) req.write(body);
    req.end();
  });
}

// Emuler la création d'un JWT algorithme NONE
const algNoneToken = Buffer.from(JSON.stringify({alg: "none", typ: "JWT"})).toString('base64url') + 
                     '.' + 
                     Buffer.from(JSON.stringify({id: "60b9eb6b5c328e18f8e02d6b", role: "admin", iat: Date.now()})).toString('base64url') + 
                     '.';

async function runOffensiveTests() {
  console.log('🔥 DÉMARRAGE DES TESTS OFFENSIFS (EDGE CASES) 🔥\n');

  // ---------- 1. PATH TRAVERSAL (LFI) ----------
  console.log('--- 1. Path Traversal ---');
  let res = await fetchHttp('GET', `${RAW_BASE}/hls/../../../../../etc/passwd`);
  addResult('LFI sur HLS Static Route', [400, 403, 404].includes(res.status), `Code reçu: ${res.status}`);

  res = await fetchHttp('GET', `${RAW_BASE}/uploads/private/../../../../etc/passwd`);
  addResult('LFI sur Uploads Private', [400, 403, 404].includes(res.status), `Code reçu: ${res.status}`);

  // ---------- 2. JWT MANIPULATION ----------
  console.log('\n--- 2. JWT Security ---');
  res = await fetchHttp('GET', '/admin/users', null, { 'Authorization': `Bearer ${algNoneToken}` });
  addResult('Rejet de l\'Algo "none"', res.status === 401, `Code reçu: ${res.status} (Bloqué par JsonWebToken par défaut)`);

  res = await fetchHttp('GET', '/admin/users', null, { 'Authorization': `Bearer aaa.bbb.ccc` });
  addResult('Rejet d\'un Token Malformé', res.status === 401, `Code reçu: ${res.status}`);

  // ---------- 3. RATE LIMITING (DENIAL OF SERVICE) ----------
  console.log('\n--- 3. Bruteforce / Rate Limiting ---');
  let blocked = false;
  for (let i = 0; i < 15; i++) {
    const r = await fetchHttp('POST', '/auth/login', { email: `fake${Math.random()}@test.mg`, password: "123" });
    if (r.status === 429) blocked = true;
  }
  addResult('Rate Limit (10 req/15min) sur Auth', blocked, blocked ? 'L\'IP locale a bien été bloquée.' : 'L\'IP n\'a pas pris de 429 !');

  // ---------- 4. PAYLOADS GÉANTS (RAM EXHAUSTION) ----------
  console.log('\n--- 4. RAM Exhaustion ---');
  const giantString = 'A'.repeat(5 * 1024 * 1024); // 5 Mo de string
  res = await fetchHttp('POST', '/auth/register', { username: giantString, email: "big@payload.com", password: "123" });
  addResult('Saturation de la mémoire via String', [400, 413].includes(res.status), `Attendu: Body too large ou erreur validateur. Reçu: ${res.status}`);

  // ---------- 5. SQL/NOSQL INJECTION (MONGO) ----------
  console.log('\n--- 5. NoSQL Injection ---');
  res = await fetchHttp('POST', '/auth/login', { email: { "$gt": "" }, password: "123" });
  addResult('Injection NoSQL sur Email', [400, 401].includes(res.status), `Reçu: ${res.status}`);

  // ---------- 6. CONCURRENCE (RACE CONDITION) ----------
  console.log('\n--- 6. Idempotence & Race Condition (Stripe Webhook) ---');
  // On simule 5 webhooks Stripe identiques lancés EXACTEMENT en simultané.
  const webhookPromises = [];
  const fakeEventId = "evt_" + crypto.randomBytes(8).toString('hex');
  const fakePayload = {
    id: fakeEventId,
    type: "checkout.session.completed",
    data: { object: { metadata: { type: "purchase", userId: "60b9eb6b5c328e18f8e02d6b", contentId: "60b9eb6b5c328e18f8e02d6c" } } }
  };

  // Warning: Webhooks sur raw, le body doit êtrè buffertisé / string typique.
  const rawBody = JSON.stringify(fakePayload);
  for(let i=0; i<5; i++){
    webhookPromises.push(fetchHttp('POST', '/payment/webhook', rawBody, { 'Content-Type': 'application/json' }));
  }
  const hookResults = await Promise.all(webhookPromises);
  const successCount = hookResults.filter(r => r.status === 200).length;
  const duplicateRejects = hookResults.filter(r => r.status === 409 || r.status === 500).length;
  
  // Un webhook réussi, les autres en 409 ou jetés.
  addResult('Race Condition sur Purchase (Unique Index)', successCount <= 1, `Sur 5 requêtes concurrentes : ${successCount} Succès, ${duplicateRejects} Rejets.`);

  // SUMMARY
  console.log('\n======================================');
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  console.log(`Bilan Offensif : ${passed} / ${total} résistent aux failles.`);
  console.log('======================================\n');
}

runOffensiveTests();
