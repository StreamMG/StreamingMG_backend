# 🚀 StreamMG Backend - Documentation de Lancement

Bienvenue dans la documentation complète de déploiement et d'exécution du backend **StreamMG**. Ce manuel couvre l'installation locale, le provisionnement de données de test et le déploiement.

---

## 1. Prérequis
- **Node.js** v20 LTS (recommandé)
- **MongoDB** v7/v8 (local ou distant via Atlas)
- **FFmpeg** installé sur le système hôte (requis par `fluent-ffmpeg` pour la conversion HLS)
- **Docker** (Optionnel, uniquement pour le déploiement Staging)

---

## 2. Installation Locale (Dev)

### 2.1. Cloner et Installer
```bash
git clone <votre_depot>
cd streamMG-backend
npm install
```

### 2.2. Configuration de l'Environnement (`.env`)
Créez un fichier `.env` à la racine (ou dupliquez `.env.example`). Voici les variables requises :
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/streammg
JWT_SECRET=supersecret
JWT_EXPIRES_IN=15m
HLS_TOKEN_SECRET=hlstokensecret
SIGNED_URL_SECRET=signedurlsecret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CORS_ORIGIN_WEB=http://localhost:5173
```

*(Adaptez l'URL MongoDB selon votre configuration).*

### 2.3. Seeding des Données de Test (Important)
Pour ne pas partir de zéro, un script de seeding génère **des vidéos et des audios factices (avec FFmpeg)** et des comptes de test :
```bash
npm run seed
```
**Ce script va :**
- Vider les collections utilisateurs et contenus existantes.
- Créer 4 utilisateurs (`admin`, `provider`, `premium`, `user`), tous avec le mot de passe : `password123`.
- Créer un contenu Vidéo (10s) et un fichier Audio (10s), complet avec miniatures (`thumbnail`) et métadonnées.
- Renommer la vidéo automatiquement avec l'ID MongoDB pour qu'elle puisse être téléchargée `/api/download/:id` (Spécification S6).

### 2.4. Lancement du Serveur de Développement
```bash
npm run dev
```
L'API devrait démarrer à l'adresse `http://localhost:3001/api`.

---

## 3. Informations sur les Comptes (Après Seed)
- **Email** : `admin@test.com` | `provider@test.com` | `premium@test.com` | `user@test.com`
- **Mot de passe (tous)** : `password123`

---

## 4. Déploiement Staging (Railway / Docker)

Un environnement Docker complet **incluant Nginx** a été configuré pour la **Semaine 5 (S5)**. Le backend tourne derrière Nginx, ce qui optimise le traitement du trafic (CORS, cache) et le transfert HLS.

### 4.1. Tester la Compilation Docker en Local
```bash
docker build -t streammg-backend .
docker run -p 8080:80 --env-file .env streammg-backend
```
L'API sera ensuite disponible sur `http://localhost:8080/api`.

### 4.2. Déploiement sur Railway
1. Poussez votre repository sur GitHub.
2. Créez un projet sur **Railway.app** et importez le repository.
3. Railway détectera **automatiquement** le `Dockerfile`.
4. Ajoutez vos variables dans l'onglet **Variables** de Railway (en recopiant le `.env.example`, port=80).

---

## 5. Endpoints Principaux (Test Rapide)
- **Healthcheck** : `GET /api/health`
- **Authentification** : `POST /api/auth/login` (body: `{ "email": "admin@test.com", "password": "password123" }`)
- **Télécharger Film** : `POST /api/download/:contentId` (Nécessite token d'Auth Bearer)

*Le reste des routes (Admin, Provider, Tutoriels, Paiement) est documenté dans le code source `src/controllers/` et l'architecture.*
