# 🎬 StreamMG Backend — API REST

> **Plateforme de streaming audiovisuel et éducatif malagasy**  
> Membre 3 — Développeur Backend + Coordination  
> Stack : Node.js v20 · Express.js v4 · MongoDB v7 (Atlas) · Stripe SDK v14

---

## ✅ Ce qui a été implémenté (S1 → S6)

### 📦 S1 — Fondations & Contrat API
- Initialisation projet Express avec tous les middlewares globaux (Helmet, CORS, Rate-limit)
- Connexion MongoDB Atlas (`config/database.js`)
- **8 schémas Mongoose complets** avec tous les index critiques :
  - `User` (TTL index sur premiumExpiry, unique email/username)
  - `Content` (**thumbnail: required: true** ⚠️, index full-text title+description)
  - `RefreshToken` (TTL index expireAfterSeconds:0 — auto-purge)
  - `Purchase` (index unique `{userId, contentId}` — idempotence)
  - `Transaction` (index unique stripePaymentId — anti-doublon webhook)
  - `WatchHistory`, `TutorialProgress`, `Playlist`
- Configuration Multer (thumbnails JPEG/PNG ≤5Mo, media MP4/MP3 ≤500Mo)
- Configuration Stripe SDK v14
- Variables d'environnement documentées (`.env.example`)

### 🔐 S2 — Auth JWT + Refresh Token
- `POST /api/auth/register` — bcrypt coût 12, génération JWT 15min + Refresh Token 7j
- `POST /api/auth/login` — validation email/password, cookie httpOnly + body mobile
- `POST /api/auth/refresh` — **Rotation systématique** : ancien token supprimé, nouveau créé
- `POST /api/auth/logout` — Suppression du Refresh Token en DB
- Middleware `auth.js` — `authRequired` + `authOptional`

### 🎬 S3 — Catalogue + Pipeline HLS
- `GET /api/contents` — pagination, filtres (type, category, accessType, isTutorial), recherche full-text
- `GET /api/contents/featured` — contenus mis en avant
- `GET /api/contents/trending` — Top 10 de la semaine par viewCount
- `GET /api/contents/:id` — détail
- `POST /api/contents/:id/view` — incrément compteur
- `GET /api/contents/:id/lessons` — leçons tutoriel (JWT + checkAccess)
- `ffmpegService.js` — transcoding MP4 → segments HLS .ts de 10 secondes
- `music-metadata` — extraction ID3 automatique (artiste, album, durée)
- Upload provider avec `POST /api/provider/contents` (multipart, thumbnail OBLIGATOIRE)

### 🛡️ S4 — Sécurité HLS + checkAccess
- **`checkAccess.js`** — logique freemium complète :
  - `free` → accès sans restriction
  - `premium` → role premium ou admin requis
  - `paid` → achat spécifique requis en DB (**même pour les Premium = TF-ACC-06 ⭐**)
  - Admin bypass sur tous les types
- **`cryptoService.js`** — Fingerprint SHA-256 (UA + IP + sessionId)
- **`hlsTokenizer.js`** — Token JWT 10min + vérification fingerprint sur chaque segment .ts
- `GET /api/hls/:contentId/token` → `{ hlsUrl, expiresIn: 600 }`
- Fichiers .ts servis via `/hls/:contentId/*` avec middleware hlsTokenizer
- **Ce qui est bloqué** : IDM, JDownloader, copie URL, partage lien HLS

### 📊 S5 — Historique + Tutoriels
- `POST /api/history/:contentId` — enregistrement/MAJ progression (upsert, auto-complete >90%)
- `GET /api/history` — historique paginé avec populate Content
- `POST /api/tutorial/progress/:contentId` — MAJ leçon + calcul automatique `percentComplete`
- `GET /api/tutorial/progress` — tutoriels en cours (< 100% terminé)

### 🔒 S6 — Chiffrement AES-256-GCM (Mobile)
- `POST /api/download/:contentId` → `{ aesKeyHex, ivHex, signedUrl, expiresIn: 900 }`
  - Clé AES-256 : `crypto.randomBytes(32)` = 64 chars hex
  - IV : `crypto.randomBytes(16)` = 32 chars hex
  - **La clé n'est JAMAIS stockée en base de données**
- URL signée HMAC-SHA256 avec expiration 15 minutes
- `validateSignedUrl.js` — vérification HMAC + expiration
- `GET /private/:contentId` — servir le fichier source signé (streaming par chunks, supporte reprises)

---

## 🗂️ Structure du projet

```
backend/
├── server.js                    ← Point d'entrée (port, démarrage)
├── app.js                       ← Config Express, middlewares globaux
├── .env.example                 ← Variables d'environnement requises
│
├── config/
│   ├── database.js              ← Connexion MongoDB Atlas
│   ├── multer.js                ← Upload thumbnail + media
│   └── stripe.js                ← Instance Stripe SDK v14
│
├── models/                      ← 8 Schémas Mongoose
│   ├── User.js                  ← role, isPremium, premiumExpiry
│   ├── Content.js               ← thumbnail: required: true ⚠️
│   ├── RefreshToken.js          ← TTL index auto-purge
│   ├── Purchase.js              ← index unique {userId, contentId}
│   ├── Transaction.js           ← index unique stripePaymentId
│   ├── WatchHistory.js
│   ├── TutorialProgress.js
│   └── Playlist.js
│
├── middlewares/
│   ├── auth.js                  ← authRequired + authOptional
│   ├── checkAccess.js           ← ⭐ Logique freemium (TF-ACC-06)
│   ├── hlsTokenizer.js          ← Token + fingerprint SHA-256
│   ├── requireRole.js           ← admin / provider
│   ├── validateThumbnail.js     ← req.files.thumbnail obligatoire
│   ├── validateSignedUrl.js     ← HMAC + expiration AES URL
│   └── errorHandler.js          ← Gestionnaire global
│
├── controllers/
│   ├── authController.js        ← S2
│   ├── contentController.js     ← S3
│   ├── hlsController.js         ← S4
│   ├── downloadController.js    ← S6
│   ├── historyController.js     ← S5
│   ├── tutorialController.js    ← S5
│   ├── paymentController.js     ← S7 (inclus)
│   ├── providerController.js    ← S3/S8
│   └── adminController.js       ← S8 (inclus)
│
├── routes/
│   ├── auth.routes.js
│   ├── content.routes.js
│   ├── hls.routes.js
│   ├── hlsFiles.routes.js       ← Segments .ts statiques sécurisés
│   ├── download.routes.js
│   ├── history.routes.js
│   ├── tutorial.routes.js
│   ├── payment.routes.js
│   ├── provider.routes.js
│   └── admin.routes.js
│
├── services/
│   ├── ffmpegService.js         ← transcodeToHls, getVideoDuration
│   ├── cryptoService.js         ← fingerprint, HLS token, AES, HMAC
│   └── stripeService.js         ← PaymentIntent, webhook
│
└── uploads/
    ├── thumbnails/              ← ✅ Accès public
    ├── hls/<contentId>/         ← 🔒 Token HLS requis
    ├── audio/                   ← ✅ Accès public
    └── private/                 ← ❌ Jamais accessible directement
```

---

## 🚀 Installation & Démarrage

```bash
# 1. Cloner le dépôt
git clone <repo-url>
cd backend

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Démarrer en développement
npm run dev

# 5. Démarrer en production
npm start
```

### Prérequis système
- **Node.js v20+**
- **ffmpeg** installé sur le système (`apt install ffmpeg` ou via binaires)
- Compte **MongoDB Atlas** (cluster M0 gratuit)
- Compte **Stripe** (mode test)

---

## 🔑 Variables d'environnement requises

| Variable | Description | Exemple |
|---|---|---|
| `MONGODB_URI` | Chaîne de connexion Atlas | `mongodb+srv://...` |
| `JWT_SECRET` | Secret JWT (256 bits) | `openssl rand -hex 32` |
| `JWT_EXPIRY` | Durée token accès | `15m` |
| `HLS_TOKEN_SECRET` | Secret tokens HLS | `openssl rand -hex 32` |
| `HLS_TOKEN_EXPIRY` | Durée token HLS (sec) | `600` |
| `SIGNED_URL_SECRET` | Secret URL signées AES | `openssl rand -hex 32` |
| `SIGNED_URL_EXPIRY` | Durée URL signée (sec) | `900` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe test | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | `whsec_...` |
| `BASE_URL` | URL base du serveur | `http://localhost:3001` |
| `ALLOWED_ORIGINS` | CORS (séparés par virgule) | `http://localhost:5173,...` |

---

## 📡 Endpoints principaux

| Méthode | Route | Auth | Semaine |
|---|---|---|---|
| POST | `/api/auth/register` | Public | S2 |
| POST | `/api/auth/login` | Public | S2 |
| POST | `/api/auth/refresh` | Cookie | S2 |
| GET | `/api/contents` | Optionnel | S3 |
| GET | `/api/contents/featured` | Optionnel | S3 |
| GET | `/api/contents/trending` | Optionnel | S3 |
| GET | `/api/contents/:id` | Optionnel | S3 |
| GET | `/api/hls/:id/token` | JWT + checkAccess | S4 |
| GET | `/hls/:contentId/*` | Token HLS | S4 |
| POST | `/api/history/:contentId` | JWT | S5 |
| POST | `/api/tutorial/progress/:contentId` | JWT | S5 |
| POST | `/api/download/:contentId` | JWT + checkAccess | S6 |
| GET | `/private/:contentId` | URL signée | S6 |
| POST | `/api/payment/subscribe` | JWT | S7 |
| POST | `/api/payment/purchase` | JWT | S7 |
| POST | `/api/payment/webhook` | Stripe sig | S7 |
| POST | `/api/provider/contents` | JWT + provider | S3 |
| GET | `/api/admin/stats` | JWT + admin | S8 |

---

## ⭐ Points critiques à démontrer en soutenance

### TF-ACC-06 — Premium ≠ Payant
```
JWT role:premium + contenu accessType:"paid" + SANS achat en DB
→ 403 { reason: "purchase_required", price: X }
```
L'abonnement Premium **ne couvre jamais** les contenus de type `paid`.

### Protection HLS Anti-téléchargement
- Aucun fichier `.mp4` accessible via URL
- `/uploads/private/` → **aucune route Express**
- Chaque segment `.ts` vérifie token JWT + fingerprint SHA-256
- IDM/JDownloader → fingerprint différent → 403 après 1-3 segments

### Chiffrement AES-256-GCM
- Clé `crypto.randomBytes(32)` générée à chaque requête
- **Jamais stockée en DB** — transmise une seule fois
- Fichier `.enc` illisible sans la clé (SecureStore iOS/Android)

### Thumbnail OBLIGATOIRE (triple validation)
1. Frontend — bouton désactivé sans image
2. Multer — fileFilter MIME + taille
3. `validateThumbnail` middleware — 400 si absent
4. Mongoose — `required: true` — erreur DB si contourné

---

## 🧪 Tests Postman

Voir `Plan de Tests Backend` dans la documentation :
- **TF-AUTH** (5 tests) — Authentification
- **TF-THUMB** (6 tests) — Vignette obligatoire
- **TF-ACC** (7 tests) — checkAccess freemium
- **TF-HLS** (6 tests) — Protection HLS
- **TF-AES** (6 tests) — Chiffrement mobile
- **TF-PUR** (4 tests) — Paiements Stripe
- **TF-TUT** (4 tests) — Tutoriels
- **TF-SEC** (6 tests) — Sécurité OWASP

---

## 👥 Équipe

| Membre | Rôle | Stack |
|---|---|---|
| **Membre 1** | Mobile | React Native / Expo |
| **Membre 2** | Web Frontend | React.js / Vite |
| **Membre 3** | Backend + Coordination | Node.js / Express / MongoDB |

---

*Mars 2026 — Projet StreamMG — Plateforme malagasy*
