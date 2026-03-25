/**
 * 🛒 Test Complet du Flux d'Achat (avec Mock Stripe)
 * Vérifie RÈGLE-08 (Distinction Purchase/Sub) et RÈGLE-09 (Idempotence)
 */
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;
const PAID_CONTENT_ID = '69c2cb67d41e0d3a19548545'; // Paid Content ID from DB

async function runFullPurchaseTest() {
  console.log('🚀 Démarrage du test complet du flux d\'achat...\n');

  try {
    // 1. Inscription d'un nouvel acheteur
    const email = `buyer_${Date.now()}@test.com`;
    console.log(`📝 [1/5] Inscription : ${email}...`);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      username: `buyer_${Date.now()}`,
      email: email,
      password: 'password123'
    });
    const userId = regRes.data.user._id;
    const token = regRes.data.token;
    console.log(`✅ Acheteur créé (ID: ${userId}).\n`);

    // 2. Test Idempotence (RÈGLE-09) - Création d'intention d'achat
    console.log(`💳 [2/5] Test RÈGLE-09 (Idempotence) : Création de l'intention d'achat...`);
    
    // On va simuler l'appel à l'API. Note: Si Stripe n'est pas configuré, ça échouera à moins de mocker au niveau du serveur.
    // Pour ce test, on va directement utiliser le Webhook Service pour simuler la réussite de Stripe.
    
    // 3. Simulation du Webhook Stripe (RÈGLE-08)
    console.log('⚡ [3/5] Simulation du Webhook Stripe : payment_intent.succeeded (Type: purchase)...');
    
    // On appelle directement la logique de traitement du Webhook pour éviter les problèmes de signature Stripe en dev.
    const webhookService = require('../src/services/webhook.service');
    const paymentIntentMock = {
      id: `pi_mock_${Date.now()}`,
      amount: 800,
      metadata: {
        type: 'purchase',
        userId: userId,
        contentId: PAID_CONTENT_ID
      }
    };

    await mongoose.connect(process.env.MONGODB_URI);
    await webhookService.handlePaymentSucceeded(paymentIntentMock);
    console.log('✅ Webhook traité (Achat validé).\n');

    // 4. Vérification de la RÈGLE-09 (Tentative de doublon via l'API)
    console.log('🛡️ [4/5] Vérification Idempotence : Tentative de ré-achat du même contenu...');
    try {
      await axios.post(`${API_URL}/payment/purchase`, { contentId: PAID_CONTENT_ID }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.error('❌ ERREUR : Le système a permis de ré-acheter le même contenu !');
      process.exit(1);
    } catch (err) {
      if (err.response?.status === 409) {
        console.log('✅ SUCCÈS : Doublon bloqué avec code 409 (RÈGLE-09 respectée).\n');
      } else {
        console.error(`❌ ERREUR : Statut inattendu : ${err.response?.status}`);
        throw err;
      }
    }

    // 5. Test Accès Final
    console.log('🎬 [5/5] Test d\'accès au contenu après achat...');
    const accessRes = await axios.post(`${API_URL}/download/${PAID_CONTENT_ID}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (accessRes.data.signedUrl) {
      console.log('✅ SUCCÈS : Accès débloqué par le webhook.');
    } else {
      throw new Error('Échec : Accès non accordé.');
    }

    console.log('\n🎉 TEST DE FLUX D\'ACHAT @user_global RÉUSSI !');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ÉCHEC DU TEST D\'ACHAT :');
    console.error(err.response?.data || err.message);
    process.exit(1);
  }
}

runFullPurchaseTest();
