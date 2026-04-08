const maxWait = 10000;
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/User.model');
const Content = require('../src/models/Content.model');

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const HLS_URL = `http://localhost:${process.env.PORT || 3001}`;

// To simulate cookie session and fingerprint, we need to handle cookies and User-Agent
const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (TestRunner)'
  },
  withCredentials: true
});

let cookieHeader = '';
// Intercept response to save cookies
axiosInstance.interceptors.response.use(response => {
  if (response.headers['set-cookie']) {
    cookieHeader = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  }
  return response;
}, error => Promise.reject(error));

// Inject cookies on request
axiosInstance.interceptors.request.use(config => {
  if (cookieHeader) config.headers.Cookie = cookieHeader;
  return config;
}, error => Promise.reject(error));

async function runTest() {
  console.log('🎬 Testing HLS Video Playback (@user_global compliance) ...\n');
  
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Get a test video content
  const content = await Content.findOne({ type: 'video', isPublished: true, hlsPath: { $ne: null } });
  if (!content) {
    console.error('❌ Aucun contenu vidéo prêt (HLS) dans la base. Le seed_real_content est sûrement en cours.');
    process.exit(1);
  }
  const premiumVideoId = content._id.toString();
  console.log(`🎬 Vidéo sélectionnée pour le test: ${premiumVideoId} (${content.title})`);

  // 2. Login as premium user
  console.log('--- 1. Login as Premium User ---');
  let token;
  try {
    const res = await axiosInstance.post(`${API_URL}/auth/login`, { email: 'premium@test.com', password: 'password123' });
    token = res.data.token;
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Logged in successfully.\n');
  } catch (err) {
    console.error('❌ Login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Request HLS Token
  console.log('--- 2. Request HLS Token ---');
  let hlsUrl;
  try {
    const res = await axiosInstance.get(`${API_URL}/hls/${premiumVideoId}/token`);
    hlsUrl = res.data.hlsUrl;
    console.log(`✅ HLS Token received. URL: ${hlsUrl}`);
    console.log(`   Expires in: ${res.data.expiresIn}s\n`);
  } catch (err) {
    console.error('❌ HLS Token request failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Request Manifest with token
  console.log('--- 3. Fetch Manifest (index.m3u8) ---');
  try {
    const res = await axiosInstance.get(`${HLS_URL}${hlsUrl}`);
    console.log('✅ Manifest fetched successfully. (Status: ' + res.status + ')\n');
  } catch (err) {
    console.error('❌ Manifest fetch failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5. Request Segment with same token and fingerprint
  console.log('--- 4. Fetch Video Segment (seg000.ts) ---');
  try {
    const tokenPart = hlsUrl.split('?token=')[1];
    const segmentUrl = `${HLS_URL}/hls/${premiumVideoId}/seg000.ts?token=${tokenPart}`;
    const res = await axiosInstance.get(segmentUrl);
    console.log('✅ Segment fetched successfully. (Status: ' + res.status + ')\n');
  } catch (err) {
    console.error('❌ Segment fetch failed:', err.response?.data || err.response?.status || err.message);
    process.exit(1);
  }

  // 6. Test invalid fingerprint (Changing User-Agent)
  console.log('--- 5. Security Test: Invalid Fingerprint (Accessing with different User-Agent) ---');
  try {
    const tokenPart = hlsUrl.split('?token=')[1];
    const segmentUrl = `${HLS_URL}/hls/${premiumVideoId}/seg000.ts?token=${tokenPart}`;
    
    // Simulate someone stealing the token and URL but using a different browser
    await axios.get(segmentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (ThiefBrowser)'
      }
    });
    console.error('❌ SECURITY FAILURE: Fetched segment with invalid fingerprint! Should have been 403.');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ SECURITY SUCCESS: Request rejected with 403 (Invalid Fingerprint).');
      console.log('   Reason:', err.response.data);
    } else {
      console.error(`❌ Unexpected error (expected 403): ${err.response?.status}`, err.response?.data || err.message);
      process.exit(1);
    }
  }

  // 7. Test direct access without token
  console.log('\n--- 6. Security Test: Direct Access Without Token ---');
  try {
    await axiosInstance.get(`${HLS_URL}/hls/${premiumVideoId}/seg000.ts`);
    console.error('❌ SECURITY FAILURE: Fetched segment without token! Should have been 403.');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ SECURITY SUCCESS: Request rejected with 403 (Missing Token).');
      console.log('   Reason:', err.response.data);
    } else {
      console.error(`❌ Unexpected error (expected 403): ${err.response?.status}`, err.response?.data || err.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL VIDEO PLAYBACK TESTS PASSED SUCCESSFULLY! Compliance with @user_global verified.');
  process.exit(0);
}

runTest();
