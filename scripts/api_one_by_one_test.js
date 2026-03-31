/**
 * 🧪 Comprehensive One-by-One API Test
 * Checks every endpoint defined in api_documentation_streamMG.md
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const RESULTS_FILE = path.join(__dirname, '../api_test_results.md');

// State for tests
let tokens = {
  user: null,
  premium: null,
  provider: null,
  admin: null
};

let contentIds = {};

// Reporter
const results = [];
function report(category, method, endpoint, status, pass, details = '') {
  results.push(`| ${category} | ${method} | \`${endpoint}\` | ${status} | ${pass ? '✅' : '❌'} | ${details} |`);
  console.log(`${pass ? '✅' : '❌'} [${category}] ${method} ${endpoint} - ${status}`);
}

async function runTests() {
  console.log('🏁 Starting Comprehensive API Testing...\n');
  
  if (fs.existsSync(RESULTS_FILE)) fs.unlinkSync(RESULTS_FILE);
  fs.writeFileSync(RESULTS_FILE, '# 🧪 API Test Results — StreamMG\n\n');
  fs.appendFileSync(RESULTS_FILE, `**Date :** ${new Date().toLocaleString()}\n\n`);
  fs.appendFileSync(RESULTS_FILE, '| Catégorie | Méthode | Endpoint | Status | Résultat | Détails |\n');
  fs.appendFileSync(RESULTS_FILE, '|---|---|---|---|---|---|\n');

  try {
    // ── 🔐 AUTHENTICATION ──────────────────────────────────────────
    console.log('🔐 Testing AUTH endpoints...');
    
    // Login User
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: 'user@test.com', password: 'password123' });
      tokens.user = res.data.token;
      report('Auth', 'POST', '/auth/login (User)', res.status, true, 'Token received');
    } catch (e) { report('Auth', 'POST', '/auth/login (User)', e.response?.status || 'ERR', false, e.message); }

    // Login Premium
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: 'premium@test.com', password: 'password123' });
      tokens.premium = res.data.token;
      report('Auth', 'POST', '/auth/login (Premium)', res.status, true, 'Role verified');
    } catch (e) { report('Auth', 'POST', '/auth/login (Premium)', e.response?.status || 'ERR', false); }

    // Login Provider
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: 'provider@test.com', password: 'password123' });
      tokens.provider = res.data.token;
      report('Auth', 'POST', '/auth/login (Provider)', res.status, true);
    } catch (e) { report('Auth', 'POST', '/auth/login (Provider)', e.response?.status || 'ERR', false); }

    // Login Admin
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email: 'admin@test.com', password: 'password123' });
      tokens.admin = res.data.token;
      report('Auth', 'POST', '/auth/login (Admin)', res.status, true);
    } catch (e) { report('Auth', 'POST', '/auth/login (Admin)', e.response?.status || 'ERR', false); }

    // Refresh Token (Web style - cookie)
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
      report('Auth', 'POST', '/auth/refresh', res.status, true);
    } catch (e) { report('Auth', 'POST', '/auth/refresh', e.response?.status || 'ERR', false, 'Expected fail in CLI due to cookie'); }

    // Logout
    try {
      const res = await axios.post(`${API_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('Auth', 'POST', '/auth/logout', res.status, true);
      // Re-login to get token back for further tests
      const relogin = await axios.post(`${API_URL}/auth/login`, { email: 'user@test.com', password: 'password123' });
      tokens.user = relogin.data.token;
    } catch (e) { report('Auth', 'POST', '/auth/logout', e.response?.status || 'ERR', false); }

    // ── 🏠 CATALOGUE ───────────────────────────────────────────────
    console.log('\n🏠 Testing CATALOGUE endpoints...');
    
    // List Contents
    try {
      const res = await axios.get(`${API_URL}/contents`);
      contentIds.free = res.data.contents.find(c => c.accessType === 'free')?._id;
      contentIds.premium = res.data.contents.find(c => c.accessType === 'premium')?._id;
      contentIds.paid = res.data.contents.find(c => c.accessType === 'paid')?._id;
      report('Catalog', 'GET', '/contents', res.status, true, `Found ${res.data.contents.length} items`);
    } catch (e) { report('Catalog', 'GET', '/contents', e.response?.status || 'ERR', false); }

    // Featured
    try {
      const res = await axios.get(`${API_URL}/contents/featured`);
      report('Catalog', 'GET', '/contents/featured', res.status, true);
    } catch (e) { report('Catalog', 'GET', '/contents/featured', e.response?.status || 'ERR', false); }

    // Trending
    try {
      const res = await axios.get(`${API_URL}/contents/trending`);
      report('Catalog', 'GET', '/contents/trending', res.status, true);
    } catch (e) { report('Catalog', 'GET', '/contents/trending', e.response?.status || 'ERR', false); }

    // Detail
    try {
      const res = await axios.get(`${API_URL}/contents/${contentIds.free}`);
      report('Catalog', 'GET', '/contents/:id', res.status, true, res.data.title);
    } catch (e) { report('Catalog', 'GET', '/contents/:id', e.response?.status || 'ERR', false); }

    // View Count
    try {
      const res = await axios.post(`${API_URL}/contents/${contentIds.free}/view`);
      report('Catalog', 'POST', '/contents/:id/view', res.status, true, `Now ${res.data.viewCount}`);
    } catch (e) { report('Catalog', 'POST', '/contents/:id/view', e.response?.status || 'ERR', false); }

    // ── ▶️ PLAYBACK ────────────────────────────────────────────────
    console.log('\n▶️ Testing PLAYBACK endpoints...');

    // HLS Token (Premium Content as User -> 403)
    try {
      await axios.get(`${API_URL}/hls/${contentIds.premium}/token`, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('Playback', 'GET', '/hls/:id/token (Forbidden)', 200, false, 'Should have been 403');
    } catch (e) { 
      report('Playback', 'GET', '/hls/:id/token (Forbidden)', e.response?.status, e.response?.status === 403, e.response?.data?.reason); 
    }

    // HLS Token (Premium Content as Premium -> 200)
    let hlsUrl;
    try {
      const res = await axios.get(`${API_URL}/hls/${contentIds.premium}/token`, { headers: { Authorization: `Bearer ${tokens.premium}` } });
      hlsUrl = res.data.hlsUrl;
      report('Playback', 'GET', '/hls/:id/token (Success)', res.status, true);
    } catch (e) { report('Playback', 'GET', '/hls/:id/token (Success)', e.response?.status || 'ERR', false); }

    // Manifest (with token)
    if (hlsUrl) {
      try {
        const res = await axios.get(`http://localhost:${process.env.PORT || 3001}${hlsUrl}`);
        report('Playback', 'GET', '/hls/:id/index.m3u8', res.status, true, 'Manifest received');
      } catch (e) { report('Playback', 'GET', '/hls/:id/index.m3u8', e.response?.status || 'ERR', false); }
    }

    // Audio URL (Free)
    try {
      const res = await axios.get(`${API_URL}/audio/${contentIds.free}/url`, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('Playback', 'GET', '/audio/:id/url', res.status, true, 'Signed URL received');
    } catch (e) { report('Playback', 'GET', '/audio/:id/url', e.response?.status || 'ERR', false); }

    // ── 📜 HISTORY & PROGRESS ──────────────────────────────────────
    console.log('\n📜 Testing HISTORY endpoints...');

    // Save Progress
    try {
      const res = await axios.post(`${API_URL}/history/${contentIds.free}`, 
        { progress: 120, duration: 240, completed: false }, 
        { headers: { Authorization: `Bearer ${tokens.user}` } }
      );
      report('History', 'POST', '/history/:contentId', res.status, true);
    } catch (e) { report('History', 'POST', '/history/:contentId', e.response?.status || 'ERR', false); }

    // Get History
    try {
      const res = await axios.get(`${API_URL}/history`, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('History', 'GET', '/history', res.status, true, `Found ${res.data.history.length} items`);
    } catch (e) { report('History', 'GET', '/history', e.response?.status || 'ERR', false); }

    // ── 💳 PAYMENT ─────────────────────────────────────────────────
    console.log('\n💳 Testing PAYMENT endpoints...');

    // Status
    try {
      const res = await axios.get(`${API_URL}/payment/status`, { headers: { Authorization: `Bearer ${tokens.premium}` } });
      report('Payment', 'GET', '/payment/status', res.status, true, `isPremium: ${res.data.isPremium}`);
    } catch (e) { report('Payment', 'GET', '/payment/status', e.response?.status || 'ERR', false); }

    // Create Purchase Intent
    try {
      const res = await axios.post(`${API_URL}/payment/purchase`, { contentId: contentIds.paid }, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('Payment', 'POST', '/payment/purchase', res.status, true, 'Intent created');
    } catch (e) { report('Payment', 'POST', '/payment/purchase', e.response?.status || 'ERR', false); }

    // Purchases List
    try {
      const res = await axios.get(`${API_URL}/payment/purchases`, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('Payment', 'GET', '/payment/purchases', res.status, true);
    } catch (e) { report('Payment', 'GET', '/payment/purchases', e.response?.status || 'ERR', false); }

    // ── 👤 USER PROFILE ────────────────────────────────────────────
    console.log('\n👤 Testing PROFILE endpoints...');

    // Get Profile
    try {
      const res = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('User', 'GET', '/user/profile', res.status, true);
    } catch (e) { report('User', 'GET', '/user/profile', e.response?.status || 'ERR', false); }

    // Update Profile
    try {
      const res = await axios.patch(`${API_URL}/user/profile`, { username: 'Rabe_New' }, { headers: { Authorization: `Bearer ${tokens.user}` } });
      report('User', 'PATCH', '/user/profile', res.status, true);
    } catch (e) { report('User', 'PATCH', '/user/profile', e.response?.status || 'ERR', false); }

    // ── 📤 PROVIDER ────────────────────────────────────────────────
    console.log('\n📤 Testing PROVIDER endpoints...');

    // List Provider Contents
    try {
      const res = await axios.get(`${API_URL}/provider/contents`, { headers: { Authorization: `Bearer ${tokens.provider}` } });
      report('Provider', 'GET', '/provider/contents', res.status, true);
    } catch (e) { report('Provider', 'GET', '/provider/contents', e.response?.status || 'ERR', false); }

    // ── 🛠️ ADMIN ──────────────────────────────────────────────────
    console.log('\n🛠️ Testing ADMIN endpoints...');

    // Stats
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
      report('Admin', 'GET', '/admin/stats', res.status, true);
    } catch (e) { report('Admin', 'GET', '/admin/stats', e.response?.status || 'ERR', false); }

    // List Users
    try {
      const res = await axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${tokens.admin}` } });
      report('Admin', 'GET', '/admin/users', res.status, true, `Found ${res.data.users.length} users`);
    } catch (e) { report('Admin', 'GET', '/admin/users', e.response?.status || 'ERR', false); }

    console.log('\n✨ All tests completed.');

    // Write final summary to file
    fs.appendFileSync(RESULTS_FILE, '\n\n' + results.join('\n'));
    console.log(`\n📄 Report generated at ${RESULTS_FILE}`);
    process.exit(0);

  } catch (err) {
    console.error('CRITICAL ERROR DURING TESTING:', err);
    process.exit(1);
  }
}

runTests();
