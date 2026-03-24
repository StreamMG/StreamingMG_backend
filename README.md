# 🎬 StreamMG Backend API

![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express.js-v4-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-v7-47A248?style=for-the-badge&logo=mongodb)
![Stripe](https://img.shields.io/badge/Stripe-API-008CDD?style=for-the-badge&logo=stripe)

Le backend officiel pour **StreamMG**, la plateforme de streaming audiovisuel et éducatif (VOD / Musique) à Madagascar. Cette API robuste propulse à la fois l'application Mobile (React Native / Expo) et l'application Web (React).

---

## ✨ Fonctionnalités Principales

- 🔐 **Authentification Sécurisée :** Système JWT (Access Token 15min) + Refresh Token avec rotation systématique en base de données.
- 📹 **Streaming Vidéo HLS :** Transcodage FFmpeg automatisé. Les segments vidéo `.ts` ne sont jamais exposés directement et nécessitent un token cryptographique HMAC-SHA256 valide (Fingerprint IP/Navigateur).
- 💾 **Mode Hors-Ligne (Mobile) :** Distribution de clés AES-256-GCM à usage unique avec URL pré-signées pour le téléchargement chiffré sur mobile.
- 💳 **Monétisation Stripe :** Gestion des abonnements (Premium) et des achats unitaires de contenu (VOD), avec validation stricte par Webhook (metadata) et gestion d'idempotence.
- 📤 **Upload Fournisseur :** Pipeline d'upload Multipart (Multer) exigeant des vignettes et convertissant automatiquement les audios (MP3) ou vidéos (MP4).
- 📉 **Administration :** Dashboards statistiques, validation des contenus et gestion des profils (Bannissement, Rôles).

---

## 🚀 Installation & Lancement (Local)

### 1. Prérequis
- **Node.js** (v20 LTS recommandé)
- **MongoDB** (Local ou Atlas)
- **FFmpeg** installé sur la machine (nécessaire pour la conversion HLS des vidéos)
- **Stripe CLI** (pour simuler les webhooks en local)

### 2. Cloner le projet
```bash
git clone git@github.com:StreamMG/StreamingMG_backend.git
cd streamMG-backend
npm install
```

### 3. Configuration de l'environnement
Copiez le modèle et remplissez vos propres valeurs (ne jamais commiter ce fichier) :
```bash
cp .env.example .env
```

### 4. Démarrer le serveur
```bash
# Lancement classique
npm run start

# Lancement en mode développeur (avec live-reload Nodemon)
npm run dev
```
L'API écoutera par défaut sur `http://localhost:3001/api`.

### 5. Peupler la base de données (Seeding)
Pour tester rapidement la plateforme avec des utilisateurs existants (Admin, Fournisseur) ou du contenu :
```bash
# Générer les utilisateurs système par défaut (admin@streammg.mg / provider@streammg.mg)
node scripts/seed_test_users.js

# Optionnel : Alimenter le catalogue avec des contenus factices
node scripts/seed.js
```

---

## 📚 Documentations Internes

Ce dépôt inclut une série de documentations pour guider l'intégration :

- 📖 [**API Reference**](./API_REFERENCE.md) : Exhaustivité de tous les points d'accès (Endpoints), formats attendus, et exemples de réponses.
- 📱 [**Documentation d'Intégration Frontend**](./DOC_FRONTEND_INTEGRATION.md) : Guide rapide pour les équipes Mobile/Web sur l'Auth, HLS et FormData.
- ✅ [**Rapport de Conformité**](./RAPPORT_TESTS_COMPLET.md) : Validations structurelles (100% compliant) des règles d'architecture du cahier des charges (`PorteOuverteV2`).

---

## 🧪 Tests

Un script de tests "end-to-end" automatique est disponible pour valider la robustesse de l'authentification, du transcodage et des middlewares d'accès.

```bash
node scripts/test_complet.js
```
*Le test utilise des fichiers factices (`dummy files`) pour simuler un upload lourd de manière instantanée.*

---

## 🛡️ Architecture & Conformité S1-S10
*(Construit sur l'architecture `@[user_global]` par "Membre 3")*

Ce projet backend respecte à 100% les 12 RÈGLES CRITIQUES :
- Pas de clé `sk_live_` (Mode Test Stripe).
- Vignette de contenu obligatoire en base (`thumbnail`).
- Isolation : Jamais de route directe vers `/private/`.
- Clés de chiffrement AES dynamiques et volatiles en mémoire.
