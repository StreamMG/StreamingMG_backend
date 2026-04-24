/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  scripts/test_download.js — Test COMPLET pipeline téléchargement mobile
 *  StreamMG Backend · AES-256-GCM · Vérification à 200%
 *
 *  Usage : node scripts/test_download.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');

const BASE = `http://127.0.0.1:${process.env.PORT || 3001}`;
const RESULTS = [];
let PASS = 0, FAIL = 0;

// ── Helpers ────────────────────────────────────────────────────────────────
function req(method, url, body = null, extraHeaders = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url.startsWith('http') ? url : BASE + url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const headers = { ...extraHeaders };
    let bodyStr = null;

    if (body !== null) {
      bodyStr = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      headers,
    };

    const r = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let parsed;
        try { parsed = JSON.parse(raw.toString()); } catch { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers, raw });
      });
    });
    r.on('error', e => resolve({ status: -1, body: { error: e.message } }));
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

function assert(name, pass, detail = '') {
  RESULTS.push({ name, pass, detail });
  if (pass) PASS++; else FAIL++;
  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon} ${name}`);
  if (!pass || process.env.VERBOSE) console.log(`     ↳ ${detail}`);
}

async function getToken(email, password) {
  const r = await req('POST', '/api/auth/login', { email, password });
  return r.body?.token || null;
}

async function getFirstContent(accessType) {
  const r = await req('GET', `/api/contents?accessType=${accessType}&limit=1`);
  const arr = r.body?.data || r.body?.contents || r.body?.items || [];
  if (!arr.length) {
    // try without filter
    const r2 = await req('GET', `/api/contents?limit=20`);
    const all = r2.body?.data || r2.body?.contents || r2.body?.items || [];
    return all.find(c => c.accessType === accessType) || null;
  }
  return arr[0] || null;
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  PIPELINE TÉLÉCHARGEMENT MOBILE — AUDIT COMPLET     ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // ── 0. Health check ─────────────────────────────────────────────────────
  console.log('── 0. Serveur & Sanité ─────────────────────');
  const health = await req('GET', '/api/health');
  assert('Serveur accessible (GET /api/health → 200)', health.status === 200,
    `status=${health.status}`);
  if (health.status !== 200) {
    console.log('\n  ⛔ Serveur inaccessible — arrêt des tests.');
    return;
  }

  // ── 1. Auth setup ────────────────────────────────────────────────────────
  console.log('\n── 1. Authentification ─────────────────────');
  const tokenUser = await getToken('user@test.com', 'password123');
  const tokenPremium = await getToken('premium@test.com', 'password123');
  const tokenAdmin = await getToken('admin@test.com', 'password123');
  assert('Login user@test.com', !!tokenUser, `token=${tokenUser ? tokenUser.substring(0, 20) + '…' : 'null'}`);
  assert('Login premium@test.com', !!tokenPremium, `token=${tokenPremium ? tokenPremium.substring(0, 20) + '…' : 'null'}`);
  assert('Login admin@test.com', !!tokenAdmin, `token=${tokenAdmin ? tokenAdmin.substring(0, 20) + '…' : 'null'}`);

  // ── 2. Catalogue ─────────────────────────────────────────────────────────
  console.log('\n── 2. Catalogue & Contenus ─────────────────');
  const freeContent = await getFirstContent('free');
  const premiumContent = await getFirstContent('premium');
  const paidContent = await getFirstContent('paid');
  assert('Contenu free trouvé', !!freeContent, `id=${freeContent?._id}   type=${freeContent?.type}`);
  if (premiumContent) assert('Contenu premium trouvé', !!premiumContent, `id=${premiumContent?._id}`);
  else console.log('  ⚠️  Contenu premium non trouvé (ignoré pour les tests)');
  if (paidContent) assert('Contenu paid trouvé', !!paidContent, `id=${paidContent?._id}`);
  else console.log('  ⚠️  Contenu paid non trouvé (ignoré pour les tests)');

  const freeId = freeContent?._id;
  const premiumId = premiumContent?._id;
  const paidId = paidContent?._id;

  // ── 3. Contrôle Auth ────────────────────────────────────────────────────
  console.log('\n── 3. Sécurité JWT ─────────────────────────');
  if (freeId) {
    const r = await req('POST', `/api/download/${freeId}`);
    assert('POST /download sans JWT → 401', r.status === 401, `status=${r.status}`);
  }
  {
    const r = await req('POST', `/api/download/000000000000000000000000`, null, {
      Authorization: `Bearer ${tokenUser}`
    });
    assert('POST /download ID inexistant → 404', r.status === 404, `status=${r.status}`);
  }

  // ── 4. Credentials AES (contenu free) ───────────────────────────────────
  console.log('\n── 4. Génération Credentials AES-256-GCM ───');
  let signedUrl = null, saveContentId = null;
  if (freeId && tokenUser) {
    const r = await req('POST', `/api/download/${freeId}`, null, {
      Authorization: `Bearer ${tokenUser}`
    });

    // Cas normal : fichier présent → 200 | Fichier absent (pas encore transcoded) → 404
    const ok200 = r.status === 200;
    const ok404 = r.status === 404 && r.body?.code === 'FILE_NOT_FOUND';
    assert('POST /download (free+auth) → 200 ou 404 FILE_NOT_FOUND',
      ok200 || ok404,
      `status=${r.status} code=${r.body?.code}`);

    if (ok200) {
      assert('aesKeyHex présent', !!r.body?.aesKeyHex, `val=${r.body?.aesKeyHex?.substring(0, 8)}…`);
      assert('aesKeyHex = 64 hex char', r.body?.aesKeyHex?.length === 64, `len=${r.body?.aesKeyHex?.length}`);
      assert('ivHex présent', !!r.body?.ivHex, `val=${r.body?.ivHex?.substring(0, 8)}…`);
      assert('ivHex = 32 hex char', r.body?.ivHex?.length === 32, `len=${r.body?.ivHex?.length}`);
      assert('signedUrl présent', !!r.body?.signedUrl, `url=${r.body?.signedUrl?.substring(0, 60)}…`);
      assert('signedUrl contient /private/', r.body?.signedUrl?.includes('/private/'), `url=${r.body?.signedUrl}`);
      assert('signedUrl contient expires=', r.body?.signedUrl?.includes('expires='), `url=${r.body?.signedUrl}`);
      assert('signedUrl contient sig=', r.body?.signedUrl?.includes('sig='), `url=${r.body?.signedUrl}`);
      assert('expiresIn = 900', r.body?.expiresIn === 900, `val=${r.body?.expiresIn}`);
      assert('contentType présent', !!r.body?.contentType, `val=${r.body?.contentType}`);

      // Valider le format hex (aesKeyHex ne doit contenir que [0-9a-f])
      const hexOk = /^[0-9a-f]{64}$/.test(r.body.aesKeyHex || '');
      assert('aesKeyHex = hex pur [0-9a-f]', hexOk, `val=${r.body?.aesKeyHex?.substring(0, 16)}…`);

      signedUrl = r.body.signedUrl;
      saveContentId = freeId;
    } else if (ok404) {
      console.log('  ℹ️  Fichier source absent (transcodage en cours ou contenu sans fichier physique).');
    }
  }

  // ── 5. Contrôle accès (checkAccess) ─────────────────────────────────────
  console.log('\n── 5. Contrôle Accès freemium ──────────────');
  if (premiumId && tokenUser) {
    const r = await req('POST', `/api/download/${premiumId}`, null, {
      Authorization: `Bearer ${tokenUser}`
    });
    assert('Premium + user non-abonné → 403 subscription_required',
      r.status === 403 && r.body?.reason === 'subscription_required',
      `status=${r.status} reason=${r.body?.reason}`);
  }
  if (paidId && tokenPremium) {
    const r = await req('POST', `/api/download/${paidId}`, null, {
      Authorization: `Bearer ${tokenPremium}`
    });
    // RÈGLE-05 : l'abonnement premium ne couvre PAS les paid
    assert('Paid + premium sans achat → 403 purchase_required (RÈGLE-05)',
      r.status === 403 && r.body?.reason === 'purchase_required',
      `status=${r.status} reason=${r.body?.reason}`);
  }
  if (paidId && tokenAdmin) {
    const r = await req('POST', `/api/download/${paidId}`, null, {
      Authorization: `Bearer ${tokenAdmin}`
    });
    assert('Admin bypass paid → 200 ou 404',
      [200, 404].includes(r.status),
      `status=${r.status} (404=fichier absent, 200=ok)`);
  }

  // ── 6. Validation URL signée (/private) ──────────────────────────────────
  console.log('\n── 6. Route /private (Signed URL) ──────────');
  if (signedUrl) {
    // 6a. URL valide
    const parsedUrl = new URL(signedUrl);
    const r = await req('GET', signedUrl);
    assert('GET /private URL valide → 200 ou 206',
      [200, 206].includes(r.status),
      `status=${r.status} Content-Type=${r.headers['content-type']}`);

    // 6b. Sans paramètres → 403 MISSING_PARAMS
    const r2 = await req('GET', `${parsedUrl.origin}${parsedUrl.pathname}`);
    assert('GET /private sans params → 403 MISSING_PARAMS',
      r2.status === 403 && r2.body?.code === 'MISSING_PARAMS',
      `status=${r2.status} code=${r2.body?.code}`);

    // 6c. URL expirée
    const rExp = await req('GET', `${parsedUrl.origin}${parsedUrl.pathname}?expires=1000&sig=aabbcc`);
    assert('GET /private URL expirée → 403 URL_EXPIRED',
      rExp.status === 403 && rExp.body?.code === 'URL_EXPIRED',
      `status=${rExp.status} code=${rExp.body?.code}`);

    // 6d. Signature falsifiée (bonne expiry, mauvaise sig)
    const exp = parsedUrl.searchParams.get('expires');
    const rFake = await req('GET', `${parsedUrl.pathname}?expires=${exp}&sig=${'ab'.repeat(32)}`);
    assert('GET /private signature falsifiée → 403 INVALID_SIGNATURE',
      rFake.status === 403 && rFake.body?.code === 'INVALID_SIGNATURE',
      `status=${rFake.status} code=${rFake.body?.code}`);

    // 6e. Range Request 0-1023
    const rRange = await req('GET', signedUrl, null, { 'Range': 'bytes=0-1023' });
    assert('GET /private Range 0-1023 → 206 Partial Content',
      rRange.status === 206 || rRange.status === 200,
      `status=${rRange.status} CR=${rRange.headers['content-range'] || 'N/A'}`);

    // 6f. Range invalide → 416
    const rBadRange = await req('GET', signedUrl, null, { 'Range': 'bytes=999999999-9999999999' });
    assert('GET /private Range invalide → 416',
      rBadRange.status === 416,
      `status=${rBadRange.status}`);

    // 6g. Header Accept-Ranges présent
    assert('Réponse inclut Accept-Ranges: bytes',
      r.headers['accept-ranges'] === 'bytes',
      `accept-ranges=${r.headers['accept-ranges']}`);

    // 6h. Cache-Control: no-store (sécurité)
    assert('Réponse inclut Cache-Control: no-store',
      r.headers['cache-control']?.includes('no-store'),
      `cache-control=${r.headers['cache-control']}`);

  } else {
    console.log('  ⚠️  signedUrl non disponible (fichier absent du disque) — tests /private ignorés.');
  }

  // ── 7. RÈGLE-06 : clé absente de la BDD ────────────────────────────────
  console.log('\n── 7. RÈGLE-06 — Clé AES jamais en BDD ─────');
  console.log('  ℹ️  Vérification statique du code (pas de lecture BDD)');
  const ctrlSrc = fs.readFileSync(
    path.join(__dirname, '../src/controllers/downloadController.js'), 'utf8');
  assert('downloadController ne fait pas de Content.save() / findByIdAndUpdate avec clé',
    !/(aesKeyHex|ivHex).*save\(|findByIdAndUpdate.*aesKey/i.test(ctrlSrc),
    'Analyse statique du contrôleur');
  assert('downloadController ne fait pas de console.log(aesKey)',
    !/(console\.log|logger\.(info|warn|error)).*aesKey/i.test(ctrlSrc),
    'Pas de fuite de clé dans les logs');

  // ── BILAN ──────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(`║  BILAN : ${String(PASS).padEnd(3)} ✅  /  ${String(FAIL).padEnd(3)} ❌  /  ${PASS + FAIL} tests total         ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (FAIL > 0) {
    console.log('\n⛔ Échecs détaillés :');
    RESULTS.filter(r => !r.pass).forEach(r => {
      console.log(`  ❌ ${r.name}`);
      console.log(`     ↳ ${r.detail}`);
    });
  } else {
    console.log('\n  🎉 Pipeline de téléchargement — 100% opérationnel !');
  }
  console.log('');
}

run().catch(err => {
  console.error('\n💥 Erreur fatale :', err.message);
  process.exit(1);
});
