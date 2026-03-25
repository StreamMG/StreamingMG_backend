/**
 * 💰 Test de l'accès Payé (Rule-05 : Premium != Purchase & Rule-09 : Idempotence)
 */
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const PAID_CONTENT_ID = '69c2cb67d41e0d3a19548545'; // Paid Content

async function runPaidTest() {
  console.log('🚀 Démarrage du test de contenu Payé...\n');

  try {
    // 1. Register a new user
    const email = `paid_tester_${Date.now()}@test.com`;
    console.log(`📝 [1/5] Inscription de l'utilisateur : ${email}...`);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      username: `tester_${Date.now()}`,
      email: email,
      password: 'password123'
    });
    const userId = regRes.data.user._id;
    console.log(`✅ Utilisateur créé (ID: ${userId}).\n`);

    // 2. Elevate to premium (Optional but good for testing Rule-05)
    console.log('💎 [2/5] Élévation au statut Premium (pour tester la règle-05)...');
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../src/models/User.model');
    await User.findByIdAndUpdate(userId, { isPremium: true, role: 'premium' });
    console.log('✅ Utilisateur est maintenant Premium.\n');

    // 3. Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: email,
      password: 'password123'
    });
    const token = loginRes.data.token;

    // 4. Try to access paid content (Expect 403 purchase_required)
    console.log(`🎬 [3/5] Tentative d'accès au contenu PAYÉ (${PAID_CONTENT_ID}) as Premium...`);
    try {
      await axios.post(`${API_URL}/download/${PAID_CONTENT_ID}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.error('❌ ERREUR : Accès accordé alors que l\'achat est requis ! (Violation RÈGLE-05)');
      process.exit(1);
    } catch (err) {
      // Le serveur renvoie { reason: 'purchase_required', price: 800 }
      if (err.response?.status === 403 && err.response.data.reason === 'purchase_required') {
        console.log('✅ SUCCÈS : Accès refusé (RÈGLE-05 confirmée).');
      } else {
        console.error(`❌ ERREUR : Statut inattendu : ${err.response?.status}`);
        console.error('Data:', err.response?.data);
        throw err;
      }
    }

    // 5. Simulate Purchase in DB (Rule-09)
    console.log('\n💳 [4/5] Simulation d\'un achat avec Idempotence (RÈGLE-09)...');
    const Purchase = require('../src/models/Purchase.model');
    
    // Premier achat
    await Purchase.create({
      userId: userId,
      contentId: PAID_CONTENT_ID,
      amount: 800,
      stripePaymentId: `test_pi_${Date.now()}_1`,
      purchasedAt: new Date()
    });
    console.log('✅ Premier achat enregistré.');

    // Tentative de doublon (devrait échouer à cause de l'index unique)
    try {
      await Purchase.create({
        userId: userId,
        contentId: PAID_CONTENT_ID,
        amount: 800,
        stripePaymentId: `test_pi_${Date.now()}_2`,
        purchasedAt: new Date()
      });
      console.error('❌ ERREUR : L\'idempotence a échoué (doublon autorisé en base)');
      process.exit(1);
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        console.log('✅ SUCCÈS : Doublon bloqué par index unique (RÈGLE-09 confirmée).');
      } else {
        throw dbErr;
      }
    }

    // 6. Access again
    console.log('\n🎧 [5/5] Nouvelle tentative d\'accès après achat...');
    const downloadRes = await axios.post(`${API_URL}/download/${PAID_CONTENT_ID}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (downloadRes.data.signedUrl) {
      console.log('✅ SUCCÈS : Accès accordé après achat.');
      console.log(`🔗 URL : ${downloadRes.data.signedUrl.substring(0, 50)}...`);
    } else {
      throw new Error('Échec : URL signée non reçue.');
    }

    console.log('\n🎉 TOUS LES TESTS DE PAIEMENT/PREMIUM ONT RÉUSSI !');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ÉCHEC DU TEST PAYÉ :');
    console.error(err.response?.data || err.message);
    process.exit(1);
  }
}

runPaidTest();
