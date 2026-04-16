# Architecture Technique — StreamMG

**Document :** Architecture logicielle détaillée  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026

---

## 1. Vue d'ensemble

StreamMG adopte le pattern multi-client avec backend partagé. Deux clients frontend distincts consomment la même API REST Node.js/Express. La base de données MongoDB est partagée et gérée exclusivement par le backend.

```
+---------------------------+        +------------------------------+
|  APPLICATION MOBILE        |        |  APPLICATION WEB             |
|  React Native + Expo 52    |        |  React.js 18 + Vite 5        |
|  Membre 1                  |        |  Membre 2                    |
|                            |        |                              |
|  expo-av (lecture native)  |        |  hls.js + react-player       |
|  expo-file-system          |        |  Service Worker PWA          |
|  react-native-quick-crypto |        |  Stripe Elements             |
|  expo-secure-store (AES)   |        |  Cookie httpOnly             |
|  @stripe/stripe-rn         |        |  @stripe/react-stripe-js     |
|  NativeWind + zustand      |        |  Tailwind CSS + zustand      |
+------------+---------------+        +--------------+---------------+
             |                                       |
             +-------------------+-------------------+
                                 |
               [ HTTPS / REST JSON + JWT ]
                                 |
+-----------------------------------+-----------------------------------+
|  API REST — Node.js v20 + Express.js v4                              |
|  Membre 3                                                             |
|                                                                       |
|  Middleware checkAccess — vérification niveau d'accès (free/prem/paid)|
|  Middleware hlsTokenizer — génération + vérification tokens signés    |
|  JWT (15min) + Refresh Token (7j, rotation) + bcrypt (coût 12)       |
|  Multer — upload thumbnail (OBLIGATOIRE) + vidéo/audio                |
|  music-metadata — extraction ID3 (titre, artiste, durée, coverArt)   |
|  ffmpeg — transcoding vidéo → segments HLS .ts                       |
|  Génération clé AES-256 + IV pour téléchargements mobiles            |
|  Helmet headers + CORS + Rate limiting + express-validator            |
|  Stripe SDK mode test (abonnement + achat unitaire + webhook)         |
|                                                                       |
|  Routes : auth / contents / hls / download / history / tutorial      |
|           provider / admin / payment                                  |
+-------+-----------------------------+---------------------------------+
        |                             |
+-------+-------+    +----------------+-----------------------------------+
|  MongoDB v7   |    |  Stockage fichiers                                |
|  users        |    |  /uploads/thumbnails/   ← vignettes (OBLIGATOIRE) |
|  contents     |    |  /uploads/hls/<id>/     ← segments .ts (vidéos)   |
|  watchHistory |    |  /uploads/audio/        ← fichiers audio .mp3     |
|  playlists    |    |  /uploads/private/      ← sources brutes (privées)|
|  refreshTokens|    +----------------------------------------------------+
|  transactions |             |
|  purchases    |    [Stripe API — mode test]
|  tutorialProg.|
+---------------+
```

---

## 2. Stack technologique complète

### 2.1 Application mobile — Membre 1

| Composant | Technologie | Rôle |
|---|---|---|
| Framework | React Native 0.76 + Expo SDK 52 | Application native iOS/Android |
| Navigation | expo-router v3 | File-based routing |
| Lecture média | expo-av v14 | Lecteur vidéo et audio natif |
| Mode paysage | expo-screen-orientation | Rotation automatique vidéo |
| Stockage local | expo-file-system | Téléchargement hors-ligne (chunks) |
| **Chiffrement** | **react-native-quick-crypto** | **AES-256-GCM chiffrement local** |
| Token sécurisé | expo-secure-store | Refresh token + clé AES (iOS Keychain / Android Keystore) |
| Paiement | @stripe/stripe-react-native | CardField natif (abonnement + achat) |
| État global | zustand v4 | authStore, playerStore, cartStore |
| Requêtes API | TanStack Query v5 | Cache, invalidation, états de chargement |
| Client HTTP | axios | Intercepteur 401 → renouvellement JWT |
| Styling | NativeWind v4 | Classes Tailwind en React Native |

### 2.2 Application web — Membre 2

| Composant | Technologie | Rôle |
|---|---|---|
| Bibliothèque UI | React.js 18 | Interface utilisateur |
| Build tool | Vite 5 | Bundler, HMR, optimisation |
| Navigation | react-router-dom v6 | SPA routing |
| **Lecteur vidéo HLS** | **hls.js (via react-player)** | **Lecture segments .ts, tokens HLS** |
| Lecture audio | react-player | Audio HTML5 |
| Mode hors-ligne | Service Worker (Workbox) | Cache First audio, expiration 48h |
| Paiement | @stripe/react-stripe-js | Stripe Elements iframe |
| État global | zustand v4 | Structure identique au mobile |
| Requêtes API | TanStack Query v5 | Cache, invalidation |
| Client HTTP | axios | Intercepteur 401 → renouvellement JWT |
| Styling | Tailwind CSS v3 | Utility-first CSS |

### 2.3 Backend — Membre 3

| Composant | Technologie | Rôle |
|---|---|---|
| Environnement | Node.js v20 LTS | Runtime serveur |
| Framework | Express.js v4 | Routage, middleware |
| ODM | Mongoose v8 | Schémas MongoDB, validation |
| Auth tokens | jsonwebtoken v9 | JWT HS256, 15 min |
| Hachage | bcryptjs | Mots de passe + hash refresh tokens |
| Upload | Multer v1 | Thumbnail obligatoire + vidéo/audio |
| Métadonnées audio | music-metadata v10 | Extraction ID3 automatique |
| **Transcoding vidéo** | **fluent-ffmpeg** | **MP4 → segments HLS .ts** |
| **Crypto** | **Node.js crypto (natif)** | **Génération clé AES-256 + IV, tokens signés** |
| Paiement | stripe SDK v14 | PaymentIntent, webhook |
| Headers sécurité | helmet | HSTS, X-Frame, CSP, X-Content-Type |
| CORS | cors | 2 origines autorisées |
| Rate limiting | express-rate-limit | 10 req/15min auth, 200 req/15min autres |
| Validation | express-validator | Validation et sanitisation |

### 2.4 Infrastructure

| Composant | Solution |
|---|---|
| Base de données | MongoDB Atlas (cluster M0 gratuit) |
| Hébergement backend | Railway |
| Hébergement frontend web | Vercel (SPA rewrite) |
| Démonstration mobile | Expo Go (QR code) |
| Reverse proxy | Nginx + Let's Encrypt SSL |
| Versioning | Git / GitHub |

---

## 3. Protection contre les téléchargements non autorisés

### 3.1 Streaming vidéo web — HLS avec tokens signés et fingerprint

Les vidéos ne sont jamais servies sous forme de fichier `.mp4` téléchargeable. Après chaque upload, ffmpeg (fluent-ffmpeg) transcrit la vidéo source en segments HLS de 10 secondes (fichiers `.ts`) et génère un manifest `index.m3u8`.

**Flux de lecture vidéo web :**

```
1. Utilisateur clique "Lire"
2. GET /api/hls/:contentId/token  (JWT requis + checkAccess)
   → Backend génère un token HLS signé :
     {
       contentId, userId,
       fingerprint: sha256(User-Agent + IP + cookie sessionId),
       exp: now + 10min
     }
   → Retourne l'URL du manifest signée :
     /hls/:contentId/index.m3u8?token=eyJ...

3. hls.js (frontend) charge le manifest
4. Pour chaque segment .ts :
   GET /hls/:contentId/seg001.ts?token=eyJ...
   → Middleware hlsTokenizer vérifie :
     a. Token valide et non expiré
     b. fingerprint === sha256(req.headers['user-agent'] + req.ip + req.cookies.sessionId)
     c. Si échec → 403 Forbidden (IDM/JDownloader s'arrête après 1-3 segments)
5. Segment .ts déchiffré et joué par hls.js
```

**Ce que ça bloque :** IDM, JDownloader, Video DownloadHelper, copie d'URL dans un nouvel onglet, partage de lien HLS, ouverture dans un autre navigateur.

**Limite assumée :** le screen recording reste possible. Cela est mentionné explicitement en soutenance et est le cas de toutes les plateformes sans DRM (Netflix, Spotify utilisent Widevine/FairPlay qui est hors périmètre académique).

### 3.2 Téléchargement hors-ligne mobile — chiffrement AES-256-GCM

Sur mobile, le téléchargement est autorisé mais le fichier est chiffré localement et inutilisable hors de l'application.

**Flux de téléchargement mobile :**

```
1. Utilisateur clique "Télécharger" (contenu accessible)
2. POST /api/download/:contentId  (JWT requis + checkAccess)
   → Backend génère :
     - clé AES-256 (32 octets aléatoires)
     - IV (16 octets aléatoires)
     - URL signée temporaire (15 min) vers le fichier source
   → Retourne { aesKeyHex, ivHex, signedUrl }

3. Frontend React Native (Membre 1) :
   a. Télécharge le fichier par chunks de 4-8 Mo via expo-file-system
      (support de reprise sur coupure réseau)
   b. Chiffre chaque chunk avec react-native-quick-crypto (AES-256-GCM)
   c. Sauvegarde le fichier chiffré :
      FileSystem.documentDirectory + "offline/" + contentId + ".enc"
   d. Stocke clé AES + IV dans expo-secure-store (iOS Keychain / Android Keystore)
   e. Enregistre { contentId, encUri, thumbnail } dans AsyncStorage

4. Lecture hors-ligne :
   a. Charge le fichier .enc par chunks depuis le sandbox privé
   b. Déchiffre en mémoire vive uniquement (react-native-quick-crypto)
   c. Envoie le flux déchiffré directement à expo-av
   d. Aucune vidéo en clair n'est jamais écrite sur le disque
```

**Résultat :** le fichier `.enc` est totalement illisible hors de l'application, même avec Xender, Bluetooth, explorateur de fichiers ou VLC. Même en cas de vol ou de root du téléphone, la clé reste protégée par l'OS (iOS Keychain / Android Keystore).

---

## 4. Middleware checkAccess

```javascript
async function checkAccess(req, res, next) {
  const content = await Content.findById(req.params.id || req.params.contentId)
    .select('accessType price');
  if (!content) return res.status(404).json({ message: 'Contenu introuvable' });

  switch (content.accessType) {
    case 'free':
      return next();

    case 'premium':
      if (!req.user)
        return res.status(403).json({ reason: 'login_required' });
      if (req.user.role !== 'premium' && req.user.role !== 'admin')
        return res.status(403).json({ reason: 'subscription_required' });
      return next();

    case 'paid':
      if (!req.user)
        return res.status(403).json({ reason: 'login_required' });
      if (req.user.role === 'admin') return next();
      const purchase = await Purchase.findOne({
        userId: req.user.id, contentId: content._id
      });
      if (!purchase)
        return res.status(403).json({ reason: 'purchase_required', price: content.price });
      return next();

    default:
      return res.status(403).json({ reason: 'access_denied' });
  }
}
```

---

## 5. Gestion de l'authentification

### 5.1 JWT et refresh token avec rotation

Le JWT (15 min, HS256) est transmis dans `Authorization: Bearer` et stocké en mémoire vive (zustand) uniquement — jamais dans localStorage. Le refresh token (7 jours) est soumis à rotation systématique : à chaque renouvellement, l'ancien token est invalidé en base et un nouveau est émis. Il est stocké dans cookie httpOnly (web) ou expo-secure-store (mobile, même espace que la clé AES).

### 5.2 Intercepteur axios (mobile et web)

```javascript
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axiosInstance.post('/auth/refresh');
        tokenStore.setToken(data.token);
        error.config.headers['Authorization'] = `Bearer ${data.token}`;
        return axiosInstance.request(error.config);
      } catch { tokenStore.logout(); navigate('/login'); }
    }
    if (error.response?.status === 403) {
      const { reason, price } = error.response.data;
      accessGateStore.show({ reason, price });
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Vignettes — règles techniques

**Obligation :** tout contenu publié doit avoir une vignette. Cette règle est appliquée à trois niveaux :

**Backend (Membre 3) :** Multer est configuré avec `upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'media', maxCount: 1 }])`. Un middleware intermédiaire vérifie `req.files?.thumbnail` et retourne 400 si absent. Le champ `thumbnail` est `required: true` dans le schéma Mongoose.

**Frontend (Membres 1 et 2) :** le formulaire d'upload déclenche une validation côté client : le champ de sélection d'image est marqué obligatoire, un aperçu de la vignette est affiché avant soumission, et le bouton "Soumettre" est désactivé tant qu'aucune image n'est sélectionnée.

**Administration (Membres 1 et 2 pour l'interface, Membre 3 pour l'API) :** l'administrateur peut rejeter une soumission dont la vignette est de mauvaise qualité, floue, ou non représentative du contenu.

---

## 7. Différences d'implémentation mobile vs web

| Fonctionnalité | Mobile (Membre 1) | Web (Membre 2) |
|---|---|---|
| Refresh token | expo-secure-store (natif chiffré) | Cookie httpOnly (navigateur) |
| Lecture vidéo | expo-av → AVPlayer / ExoPlayer | hls.js + react-player → `<video>` HTML5 |
| Protection vidéo | Token HLS (même middleware) | Token HLS + fingerprint |
| Lecture audio | expo-av | react-player → `<audio>` HTML5 |
| Hors-ligne vidéo | AES-256-GCM → fichier .enc + expo-secure-store pour la clé | Non disponible (screen recording hors périmètre) |
| Hors-ligne audio | expo-file-system (non chiffré pour les audios) | Service Worker Cache First 48h |
| Paiement | @stripe/stripe-react-native (CardField natif) | @stripe/react-stripe-js (Elements iframe) |
| Orientation vidéo | expo-screen-orientation (paysage auto) | CSS Fullscreen API |
| Mini-player | Layout racine expo-router (absolu) | App.tsx hors RouterProvider |

---

## 8. Références bibliographiques

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216

Martin, R. C. (2017). *Clean Architecture*. Prentice Hall. ISBN 978-0134494166.

MongoDB Inc. (2025). *MongoDB — Unique Indexes*. https://www.mongodb.com/docs/manual/core/index-unique

OWASP Foundation. (2023). *OWASP Top Ten 2023*. https://owasp.org/www-project-top-ten/

Expo. (2025). *expo-secure-store Documentation*. https://docs.expo.dev/versions/latest/sdk/securestore

Expo. (2025). *expo-file-system Documentation*. https://docs.expo.dev/versions/latest/sdk/filesystem

Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* (Thèse de doctorat). University of California, Irvine.

Stripe Inc. (2026). *Webhooks — Best practices*. https://stripe.com/docs/webhooks/best-practices
