/**
 * 💎 Test de l'accès Premium (Enregistrement + Élévation)
 */
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const CONTENT_ID = '69c2c2e633554c87d9a119d9'; // Premium Content

async function runPremiumTest() {
  console.log('🚀 Démarrage du test Premium...\n');

  try {
    // 1. Register a new user
    const email = `premium_user_${Date.now()}@test.com`;
    console.log(`📝 [1/4] Inscription de l'utilisateur : ${email}...`);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      username: `user_${Date.now()}`,
      email: email,
      password: 'password123'
    });
    const userId = regRes.data.user._id;
    console.log(`✅ Utilisateur créé (ID: ${userId}).\n`);

    // 2. Elevate to premium in DB
    console.log('💎 [2/4] Élévation manuelle au statut Premium en base de données...');
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../src/models/User.model');
    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      role: 'premium',
      premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    console.log('✅ Statut Premium appliqué.\n');

    // 3. Login to get fresh token with premium role
    console.log('🔐 [3/4] Connexion pour obtenir le nouveau token...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: email,
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log(`✅ Connecté. Rôle : ${loginRes.data.user.role}\n`);

    // 4. Test Access to Premium Content
    console.log(`🎬 [4/4] Tentative d'accès au contenu Premium (${CONTENT_ID})...`);
    try {
      const hlsRes = await axios.get(`${API_URL}/hls/${CONTENT_ID}/token`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ SUCCÈS : Accès au contenu Premium autorisé.');
      console.log(`🔗 Token HLS reçu : ${hlsRes.data.hlsUrl.substring(0, 50)}...`);
    } catch (err) {
      console.error('❌ ÉCHEC : Accès refusé au contenu Premium.');
      throw err;
    }

    console.log('\n🎉 TEST PREMIUM RÉUSSI !');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ÉCHEC DU TEST PREMIUM :');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

runPremiumTest();
