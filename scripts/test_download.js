#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../src/models/User.model');
const Content = require('../src/models/Content.model');
const fs = require('fs');

const API_BASE = 'http://localhost:3001/api';
const HOST_BASE = 'http://localhost:3001';

async function generateTestUser() {
  const username = 'TestDownloadUser_' + Date.now();
  const email = username + '@test.mg';
  const password = 'Password123!';

  const { data } = await axios.post(`${API_BASE}/auth/register`, { username, email, password });
  return { ...data.user, token: data.token };
}

async function findFreeContent() {
  const { data } = await axios.get(`${API_BASE}/contents?limit=5`);
  const freeContent = data.contents.find(c => c.accessType === 'free');
  return freeContent;
}

async function main() {
  console.log("🛠️ Démarrage du test de téléchargement hors-ligne Stripe-MG...");
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Inscription utilisateur test
    console.log("👤 Création d'un utilisateur de test...");
    const user = await generateTestUser();
    console.log(`✅ Utilisateur créé : ${user.email}`);

    // 2. Trouver un contenu gratuit
    console.log("🔍 Recherche d'un contenu gratuit...");
    const freeContent = await findFreeContent();
    if (!freeContent) {
      throw new Error("Aucun contenu gratuit disponible pour tester le téléchargement.");
    }
    console.log(`✅ Contenu trouvé : ${freeContent.title} (${freeContent._id})`);

    // 3. Demander le téléchargement
    console.log("📥 Requête POST /api/download/:contentId...");
    const dlResponse = await axios.post(`${API_BASE}/download/${freeContent._id}`, {}, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    const { aesKeyHex, ivHex, signedUrl, expiresIn } = dlResponse.data;
    
    if (!aesKeyHex || !ivHex || !signedUrl) {
      throw new Error("❌ Paramètres de chiffrement manquants dans la réponse !");
    }

    if (aesKeyHex.length !== 64 || ivHex.length !== 32) {
      throw new Error("❌ Les longueurs de la clé AES ou de l'IV sont incorrectes (Règle TF-AES-01 bafouée !)");
    }
    console.log(`✅ Chiffrement récupéré : AES-256 OK (${aesKeyHex.substring(0, 10)}...), IV OK`);
    console.log(`✅ URL Signée : ${signedUrl.substring(0, 50)}...`);

    // 4. Tester l'accès à l'URL signée
    console.log("🔄 Test de l'accès à l'URL signée générée...");
    
    // Le serveur renvoie http://localhost... si host_base le permet, ou l'url absolue.
    // L'URL dans app.js/routes ne retourne pas "http", validateSignedUrl s'appuie sur le HOST, 
    // Wait, let's verify signedUrl format:
    // in cryptoService: return `https://api.streamMG.railway.app/private/...` or similar
    // We can extract the path from it to call localhost
    const urlObj = new URL(signedUrl);
    const localHostUrl = `${HOST_BASE}${urlObj.pathname}${urlObj.search}`;

    console.log(`🧱 Mocking physique : création du fichier factice src/uploads/private/${freeContent._id}_src.mp4`);
    const mockFilePath = `src/uploads/private/${freeContent._id}_src.mp4`;
    fs.mkdirSync('src/uploads/private', { recursive: true });
    fs.writeFileSync(mockFilePath, 'Dummy video data for offline download AES tests !');

    const fileStream = await axios.get(localHostUrl, { responseType: 'stream' });
    console.log(`✅ Fichier en cours de streaming (Code HTTP ${fileStream.status})`);
    
    // 5. Test d'anti-falsification (Tamper test)
    console.log("🚨 Test de rejet : falsification de l'URL signée...");
    try {
      const tamperedUrl = localHostUrl + '1';
      await axios.get(tamperedUrl, { responseType: 'stream' });
      throw new Error("❌ L'URL falsifiée a été acceptée (Grave faille de sécurité) !");
    } catch (e) {
      if (e.response && e.response.status === 403) {
         console.log("✅ Accès bloqué avec l'URL falsifiée (Code 403 Validé)");
      } else {
         throw new Error(`❌ Comportement inattendu avec URL falsifiée : (Status ${e.response?.status})`);
      }
    }

    console.log("🧹 Nettoyage du fichier factice...");
    if (fs.existsSync(mockFilePath)) fs.unlinkSync(mockFilePath);

    console.log("🎉 TEST DU WORKFLOW DE TÉLÉCHARGEMENT VALIDÉ À 100%");
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
