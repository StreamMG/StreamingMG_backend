#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3001/api';

async function generateTestUser() {
  const username = 'TestHistory_' + Date.now();
  const email = username + '@history.mg';
  const password = 'Password123!';

  const { data } = await axios.post(`${API_BASE}/auth/register`, { username, email, password });
  return { ...data.user, token: data.token };
}

async function findContent() {
  const { data } = await axios.get(`${API_BASE}/contents?limit=5`);
  return data.contents[0];
}

async function main() {
  console.log("🛠️ TEST DES ENDPOINTS DE L'HISTORIQUE");
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await generateTestUser();
    console.log(`✅ User créé : ${user.email}`);

    const content = await findContent();
    if (!content) throw new Error("Aucun contenu dispo.");
    console.log(`✅ Contenu cible : ${content.title}`);

    // TEST 1: Record History
    console.log(`\n▶️ POST /api/history/${content._id}`);
    const recordPayload = { progress: 45, duration: 100, completed: false };
    const recRes = await axios.post(`${API_BASE}/history/${content._id}`, recordPayload, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    console.log("✅ Enregistrement réussi !");

    // TEST 2: Record History update (upsert unique verify)
    console.log(`\n▶️ POST (Update) /api/history/${content._id}`);
    await axios.post(`${API_BASE}/history/${content._id}`, { progress: 95, duration: 100, completed: false }, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    console.log("✅ Mise à jour de la progression réussie !");

    // TEST 3: Get History
    console.log(`\n▶️ GET /api/history`);
    const histRes = await axios.get(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    const items = histRes.data.history;
    if (items.length !== 1) {
      throw new Error(`❌ Un seul item attendu, reçu : ${items.length}`);
    }

    const item = items[0];
    console.log("📦 Item reçu : ", JSON.stringify(item, null, 2));

    if (item.progress !== 95) {
        throw new Error("❌ Upsert a échoué. Progress devrait être 95.");
    }
    if (!item.completed) {
        throw new Error("❌ La complétion automatique (>90% duration) a échoué !");
    }
    if (!item.content && item.contentId) {
        throw new Error("❌ La propriété s'appelle `contentId` au lieu de `content` comme dans la documentation API !");
    }

    console.log("\n🎉 TOUS LES TESTS D'HISTORIQUE SONT PASSÉS !");
    process.exit(0);

  } catch (err) {
    if (err.response) {
      console.error("❌ ERREUR API:", err.response.status, err.response.data);
    } else {
      console.error("❌ ERREUR SCRIPT:", err.message);
    }
    process.exit(1);
  }
}

main();
