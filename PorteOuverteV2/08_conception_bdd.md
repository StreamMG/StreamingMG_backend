# Conception de la Base de Données — StreamMG

**Document :** Modélisation et schéma de la base de données  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026  
**Responsable :** Membre 3 — Développeur Backend

---

## 1. Choix de MongoDB

StreamMG utilise MongoDB (v7.x). Ce choix est justifié par la nature hétérogène des contenus : un film possède des attributs (résolution, réalisateur, distribution) différents d'un titre audio (artiste, album, numéro de piste). Un tutoriel possède un tableau de leçons imbriquées. Le modèle document JSON accueille cette flexibilité sans colonnes nullable ni jointures complexes. L'ajout de nouveaux champs se fait sans migration.

---

## 2. Vue d'ensemble des huit collections

```
Base de données : streamMG
│
├── users              — Comptes, rôles, statut premium
├── contents           — Catalogue complet (films, chants, docs, tutoriels)
│                        → thumbnail OBLIGATOIRE sur tout document
│                        → hlsPath (segments .ts) pour les vidéos
├── watchHistory       — Progression de lecture (position en secondes)
├── playlists          — Listes de lecture personnelles
├── refreshTokens      — Tokens de renouvellement de session (hachés bcrypt)
├── transactions       — Registre des paiements Stripe (abonnements)
├── purchases          — Achats unitaires permanents (contenus payants)
└── tutorialProgress   — Progression dans les séries de leçons
```

---

## 3. Schémas détaillés

### 3.1 Collection users

```javascript
{
  _id           : ObjectId,
  username      : String,   // Unique, 3–30 caractères, obligatoire
  email         : String,   // Unique, format email validé, obligatoire
  passwordHash  : String,   // Hachage bcrypt préfixe $2b$, coût 12
  role          : String,   // Enum : "user" | "premium" | "provider" | "admin"
  isPremium     : Boolean,  // Défaut false
  premiumExpiry : Date,     // null si non premium, J+30 ou J+365 selon plan
  avatar        : String,   // URL optionnelle (photo de profil)
  isActive      : Boolean,  // Défaut true — désactivation admin sans suppression
  createdAt     : Date,     // Mongoose timestamps
  updatedAt     : Date,
}

Index :
  email    UNIQUE   — Login et vérification unicité inscription
  username UNIQUE   — Vérification unicité inscription
  role     simple   — Requêtes admin "liste des fournisseurs"
```

---

### 3.2 Collection contents

Règle absolue : **tout document de la collection `contents` doit avoir un champ `thumbnail` renseigné** (chemin vers l'image de couverture). Cette contrainte est appliquée à trois niveaux : validation Mongoose (`required: true`), validation Multer côté backend (rejet si fichier image absent), et validation côté client avant soumission du formulaire d'upload.

```javascript
{
  _id         : ObjectId,

  // ── Champs communs à TOUS les types de contenu ──────────────────────────
  title       : String,    // Obligatoire
  description : String,    // Obligatoire
  type        : String,    // Enum : "video" | "audio"  — obligatoire
  category    : String,    // film | salegy | hira-gasy | tsapiky | beko |
                           // documentaire | podcast | tutoriel | ...  — obligatoire
  subCategory : String,    // Optionnel
  language    : String,    // Enum : "mg" | "fr" | "bilingual"  — obligatoire

  thumbnail   : String,    // ★ OBLIGATOIRE — chemin vers l'image de couverture
                           // Format : "/uploads/thumbnails/<uuid>.jpg"
                           // Dimensions minimales recommandées : 320×180 px
                           // Format accepté : JPEG ou PNG, taille ≤ 5 Mo
                           // Affiché dans toutes les cartes du catalogue,
                           // dans la page de détail, dans les miniatures du lecteur,
                           // dans les notifications et dans les résultats de recherche.
                           // Le backend rejette (400) tout upload sans fichier image.
                           // L'admin peut rejeter une soumission dont la vignette
                           // est floue, pixelisée ou non représentative du contenu.

  viewCount   : Number,    // Défaut 0 — incrémenté via $inc atomique
  isPublished : Boolean,   // Défaut false — passe à true après validation admin
  uploadedBy  : ObjectId,  // Référence users._id

  // ── Modèle économique — niveau d'accès ─────────────────────────────────
  accessType  : String,    // Enum : "free" | "premium" | "paid"  — défaut "free"
                           // Pilier du modèle économique.
                           // Lu par le middleware checkAccess sur chaque requête.
  price       : Number,    // Montant en centimes Stripe — null si accessType !== "paid"
                           // Ex : 800000 = 8 000 Ar
                           // Obligatoire et > 0 si accessType === "paid" (validation Mongoose)

  // ── Streaming vidéo — protection HLS ────────────────────────────────────
  // Applicable uniquement aux contenus de type "video" (isTutorial: false)
  filePath    : String,    // Chemin du fichier source original (stockage privé, non exposé)
  hlsPath     : String,    // Chemin du dossier HLS : "/uploads/hls/<contentId>/"
                           // Contient : index.m3u8 + segments seg001.ts, seg002.ts...
                           // Les URLs HLS sont signées par token temporaire (10 min)
                           // + fingerprint (User-Agent + IP + cookie sessionId)
                           // Jamais de fichier .mp4 servi directement au client web.
  fileSize    : Number,    // Taille du fichier source en octets
  mimeType    : String,    // Ex : "video/mp4" (source), "audio/mpeg", "audio/aac"
  duration    : Number,    // Durée en secondes — absent si isTutorial: true

  // ── Champs spécifiques AUDIO (null pour les vidéos) ──────────────────────
  artist      : String,    // Nom de l'artiste ou du groupe
  album       : String,    // Nom de l'album
  coverArt    : String,    // URL de la pochette extraite via music-metadata (ID3)
                           // Peut différer de thumbnail (pochette ≠ vignette catalogue)
  trackNumber : Number,    // Numéro de piste dans l'album

  // ── Champs spécifiques VIDEO (null pour les audios) ──────────────────────
  resolution  : String,    // Ex : "720p", "1080p"
  director    : String,
  cast        : [String],
  subtitles   : [{ language: String, filePath: String }],

  // ── Tutoriels ─────────────────────────────────────────────────────────────
  isTutorial  : Boolean,   // Défaut false
  lessons     : [          // Présent et non vide uniquement si isTutorial: true
    {
      order       : Number,  // Position dans la série (commence à 1), obligatoire
      title       : String,  // Obligatoire
      description : String,
      thumbnail   : String,  // Vignette de la leçon — optionnelle
                             // Si absente, le frontend affiche la vignette du tutoriel
      filePath    : String,  // Fichier source de la leçon (non exposé)
      hlsPath     : String,  // Dossier HLS de la leçon (si type === "video")
      duration    : Number,  // Durée en secondes — obligatoire
    }
  ],

  createdAt   : Date,
  updatedAt   : Date,
}

Index :
  { title, artist, description }  TEXTE   — Recherche full-text dans le catalogue
  category                        simple   — Filtre par catégorie
  type                            simple   — Filtre vidéo / audio
  accessType                      simple   — Filtre admin par niveau d'accès
  viewCount                       desc     — Requêtes "Tendances" (top 10)
  uploadedBy                      simple   — Requêtes "Mes contenus" du fournisseur
  isPublished                     simple   — Exclusion des contenus non publiés
  isTutorial                      simple   — Filtre section Tutoriels du catalogue
```

**Décision de conception — thumbnail séparée de coverArt.**
Pour les contenus audio, deux champs image coexistent : `thumbnail` (vignette catalogue, obligatoire, uploadée manuellement par le fournisseur) et `coverArt` (pochette extraite automatiquement des métadonnées ID3 du fichier audio par music-metadata). Ces deux images servent des usages distincts : `thumbnail` est optimisée pour l'affichage dans les grilles du catalogue (format paysage ou portrait), tandis que `coverArt` est la pochette d'album carrée affichée dans le mini-player.

**Décision de conception — embedding des leçons.**
Les leçons sont des sous-documents imbriqués dans le document parent (embedding) plutôt qu'une collection séparée, car elles n'ont pas d'existence indépendante de leur tutoriel et sont toujours chargées avec lui. L'embedding évite un $lookup sur chaque requête de catalogue.

**Décision de conception — hlsPath et filePath.**
`filePath` est le chemin du fichier source brut, stocké dans un répertoire privé non accessible directement par le client. `hlsPath` est le dossier contenant les segments HLS générés par ffmpeg après l'upload. Les URLs de ces segments sont toujours signées côté backend avant d'être transmises au frontend.

---

### 3.3 Collection watchHistory

```javascript
{
  _id             : ObjectId,
  userId          : ObjectId,  // Référence users._id
  contentId       : ObjectId,  // Référence contents._id
  progressSeconds : Number,    // Position de lecture en secondes
  isCompleted     : Boolean,   // Défaut false — true quand ≥ 90 % de la durée
  lastWatchedAt   : Date,
}

Index :
  { userId, contentId } UNIQUE  — Un seul document par paire utilisateur/contenu
  { userId, lastWatchedAt } desc — Section "Continuer à regarder"
```

---

### 3.4 Collection playlists

```javascript
{
  _id        : ObjectId,
  userId     : ObjectId,
  name       : String,
  description: String,     // Optionnel
  contentIds : [ObjectId], // Liste ordonnée de références vers contents._id
  isPublic   : Boolean,    // Défaut false
  createdAt  : Date,
  updatedAt  : Date,
}

Index : userId simple
```

---

### 3.5 Collection refreshTokens

```javascript
{
  _id       : ObjectId,
  userId    : ObjectId,
  tokenHash : String,  // Hash bcrypt du refresh token (jamais le token en clair)
  expiresAt : Date,    // J+7 depuis la création
}

Index :
  tokenHash  UNIQUE               — Recherche rapide à la vérification
  expiresAt  TTL expireAfterSeconds:0  — Suppression automatique
  userId     simple               — Invalidation de toutes les sessions d'un utilisateur
```

---

### 3.6 Collection transactions

```javascript
{
  _id             : ObjectId,
  userId          : ObjectId,
  stripePaymentId : String,  // "pi_..."
  plan            : String,  // Enum : "premium_monthly" | "premium_yearly"
  amount          : Number,  // En centimes
  currency        : String,  // "mga"
  status          : String,  // Enum : "pending" | "succeeded" | "failed" | "canceled"
  stripeEvent     : Object,  // Copie du webhook Stripe complet (audit)
  createdAt       : Date,
  updatedAt       : Date,
}

Index :
  userId          simple  — Historique de paiements utilisateur
  stripePaymentId UNIQUE  — Prévient le traitement double d'un événement
  status          simple  — Statistiques par statut
```

---

### 3.7 Collection purchases

La présence d'un document pour une paire `(userId, contentId)` constitue le titre d'accès permanent au contenu payant. C'est cette collection que le middleware `checkAccess` interroge pour les contenus `accessType: "paid"`.

```javascript
{
  _id             : ObjectId,
  userId          : ObjectId,  // Référence users._id
  contentId       : ObjectId,  // Référence contents._id
  stripePaymentId : String,    // "pi_..." — traçabilité avec Stripe
  amount          : Number,    // Montant payé en centimes au moment de l'achat
                               // (conservé même si le prix change ultérieurement)
  purchasedAt     : Date,      // Horodatage de confirmation par webhook Stripe
}

Index :
  { userId, contentId } UNIQUE
    Garantit l'idempotence : impossible de posséder deux fois le même contenu.
    En cas de double-clic ou de retour arrière, l'insertion dupliquée échoue
    en base et le backend retourne 409.

  stripePaymentId UNIQUE
    Prévient le traitement double si le webhook Stripe est délivré plusieurs fois.

  userId    simple  — Requête "Mes achats" dans le profil
  contentId simple  — Statistiques admin par contenu
```

---

### 3.8 Collection tutorialProgress

```javascript
{
  _id              : ObjectId,
  userId           : ObjectId,  // Référence users._id
  contentId        : ObjectId,  // Référence contents._id (isTutorial: true)
  lastLessonIndex  : Number,    // Index (base 0) de la dernière leçon consultée
                                // Utilisé par le bouton "Continuer" pour reprendre
                                // directement à la bonne leçon
  completedLessons : [Number],  // Indices des leçons terminées (≥ 90 % de leur durée)
  percentComplete  : Number,    // completedLessons.length / lessons.length × 100
                                // Stocké en base pour éviter de recalculer sur chaque requête
  startedAt        : Date,      // Date du premier accès au tutoriel
  lastUpdatedAt    : Date,      // Mis à jour à chaque progression
}

Index :
  { userId, contentId } UNIQUE  — Un seul document par paire utilisateur/tutoriel
  userId         simple         — Requête "Mes tutoriels en cours"
  lastUpdatedAt  desc           — Tri par activité récente
```

---

## 4. Diagramme de relations

```
users (1) ────< watchHistory (N)
users (1) ────< playlists (N)
users (1) ────< refreshTokens (N)
users (1) ────< transactions (N)
users (1) ────< purchases (N)
users (1) ────< tutorialProgress (N)
users (1) ────< contents (N)           [via uploadedBy — fournisseur]

contents (1) ────< watchHistory (N)
contents (1) ────< purchases (N)
contents (1) ────< tutorialProgress (N)
contents (N) >────< playlists (N)      [relation N-N via tableau contentIds]
```

---

## 5. Exemples de documents JSON

### Tutoriel avec vignettes (collection contents)

```json
{
  "_id": "65f3a2b4c8e9d1234567890c",
  "title": "Apprendre le salegy de Diego-Suarez — 8 leçons",
  "description": "Une série complète pour apprendre les bases du salegy.",
  "type": "video",
  "category": "tutoriel",
  "subCategory": "musique-traditionnelle",
  "language": "mg",
  "thumbnail": "/uploads/thumbnails/tuto_salegy_cover_a3f9b.jpg",
  "viewCount": 412,
  "isPublished": true,
  "uploadedBy": "65f3a1c4c8e9d1234567891c",
  "accessType": "premium",
  "price": null,
  "isTutorial": true,
  "lessons": [
    {
      "order": 1,
      "title": "Introduction : origines du salegy",
      "description": "Histoire et contexte culturel.",
      "thumbnail": "/uploads/thumbnails/salegy_lecon1_thumb.jpg",
      "filePath": "/uploads/private/salegy_lecon1_src.mp4",
      "hlsPath": "/uploads/hls/salegy_lecon1/",
      "duration": 480
    },
    {
      "order": 2,
      "title": "Les rythmes de base",
      "description": "Patterns rythmiques fondamentaux à la guitare.",
      "thumbnail": null,
      "filePath": "/uploads/private/salegy_lecon2_src.mp4",
      "hlsPath": "/uploads/hls/salegy_lecon2/",
      "duration": 720
    }
  ],
  "createdAt": "2026-01-20T09:00:00.000Z",
  "updatedAt": "2026-02-01T14:30:00.000Z"
}
```

### Film payant avec HLS (collection contents)

```json
{
  "_id": "65f3a2b4c8e9d1234567890d",
  "title": "Avant-première : Ny Fitiavana",
  "description": "Film romantique malgache, exclusivité de la plateforme.",
  "type": "video",
  "category": "film",
  "language": "mg",
  "thumbnail": "/uploads/thumbnails/ny_fitiavana_cover_b7c2d.jpg",
  "duration": 6240,
  "filePath": "/uploads/private/ny_fitiavana_src.mp4",
  "hlsPath": "/uploads/hls/ny_fitiavana/",
  "fileSize": 2147483648,
  "mimeType": "video/mp4",
  "viewCount": 89,
  "isPublished": true,
  "uploadedBy": "65f3a1c4c8e9d1234567891d",
  "accessType": "paid",
  "price": 800000,
  "isTutorial": false,
  "resolution": "720p",
  "director": "Haja Rakoto"
}
```

### Titre audio avec vignette (collection contents)

```json
{
  "_id": "65f3a2b4c8e9d1234567890a",
  "title": "Mora Mora",
  "description": "Titre emblématique du salegy moderne.",
  "type": "audio",
  "category": "salegy",
  "language": "mg",
  "thumbnail": "/uploads/thumbnails/mora_mora_cover_e1f4a.jpg",
  "filePath": "/uploads/audio/mora_mora.mp3",
  "fileSize": 8421376,
  "mimeType": "audio/mpeg",
  "duration": 243,
  "viewCount": 1842,
  "isPublished": true,
  "uploadedBy": "65f3a1c4c8e9d1234567891a",
  "accessType": "free",
  "price": null,
  "isTutorial": false,
  "artist": "Tarika Sammy",
  "album": "Mora Mora — Best Of",
  "coverArt": "/uploads/thumbnails/mora_mora_pochette_id3.jpg",
  "trackNumber": 1
}
```

### Achat unitaire (collection purchases)

```json
{
  "_id": "65f3a2b4c8e9d1234567890e",
  "userId": "65f3a2b4c8e9d12345678901",
  "contentId": "65f3a2b4c8e9d1234567890d",
  "stripePaymentId": "pi_3OqXkT2eZvKYlo2C1aB2cD3e",
  "amount": 800000,
  "purchasedAt": "2026-02-15T16:22:10.000Z"
}
```

### Progression tutoriel (collection tutorialProgress)

```json
{
  "_id": "65f3a2b4c8e9d1234567890f",
  "userId": "65f3a2b4c8e9d12345678901",
  "contentId": "65f3a2b4c8e9d1234567890c",
  "lastLessonIndex": 1,
  "completedLessons": [0, 1],
  "percentComplete": 25,
  "startedAt": "2026-02-10T20:00:00.000Z",
  "lastUpdatedAt": "2026-02-12T21:30:00.000Z"
}
```

---

## 6. Agrégations MongoDB

### Tutoriels en cours d'un utilisateur

```javascript
db.tutorialProgress.aggregate([
  { $match: { userId: ObjectId("..."), percentComplete: { $lt: 100 } } },
  { $sort: { lastUpdatedAt: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "contents", localField: "contentId",
      foreignField: "_id", as: "tutorial"
    }
  },
  { $unwind: "$tutorial" },
  {
    $project: {
      percentComplete: 1, lastLessonIndex: 1, lastUpdatedAt: 1,
      "tutorial.title": 1,
      "tutorial.thumbnail": 1,    // Vignette obligatoire — toujours présente
      totalLessons: { $size: "$tutorial.lessons" }
    }
  }
])
```

### Statistiques de ventes simulées (admin — 30 jours)

```javascript
db.purchases.aggregate([
  { $match: { purchasedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
  { $group: { _id: "$contentId", totalSales: { $sum: 1 }, totalRevenue: { $sum: "$amount" } } },
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 },
  { $lookup: { from: "contents", localField: "_id", foreignField: "_id", as: "content" } },
  { $unwind: "$content" },
  {
    $project: {
      totalSales: 1, totalRevenue: 1,
      "content.title": 1,
      "content.thumbnail": 1,     // Vignette pour l'affichage dans le dashboard admin
      "content.uploadedBy": 1
    }
  }
])
```

---

## 7. Règles de validation Multer pour les uploads

```javascript
// Configuration Multer — backend Membre 3
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') cb(null, 'uploads/thumbnails/');
    else if (file.mimetype.startsWith('video/')) cb(null, 'uploads/private/');
    else if (file.mimetype.startsWith('audio/')) cb(null, 'uploads/audio/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = {
    thumbnail: ['image/jpeg', 'image/png'],
    video: ['video/mp4', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/aac', 'audio/wav'],
  };
  if (file.fieldname === 'thumbnail' && allowed.thumbnail.includes(file.mimetype)) cb(null, true);
  else if (file.fieldname === 'media' && [...allowed.video, ...allowed.audio].includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Type MIME non autorisé : ${file.mimetype}`), false);
};

// thumbnail : obligatoire, ≤ 5 Mo
// media (vidéo ou audio) : obligatoire, ≤ 500 Mo pour vidéo, ≤ 50 Mo pour audio
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Route upload fournisseur — thumbnail est obligatoire
router.post('/provider/contents',
  auth, isProvider,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },   // ★ OBLIGATOIRE
    { name: 'media', maxCount: 1 }         // Fichier vidéo ou audio
  ]),
  (req, res, next) => {
    if (!req.files?.thumbnail) {
      return res.status(400).json({ message: 'La vignette est obligatoire.' });
    }
    next();
  },
  providerController.uploadContent
);
```

---

## 8. Références bibliographiques

Chodorow, K. (2019). *MongoDB: The Definitive Guide* (3e éd.). O'Reilly Media. ISBN 978-1491954461.

MongoDB Inc. (2025). *MongoDB v7.x Manual — Embedded Documents*. https://www.mongodb.com/docs/manual/core/data-modeling-embedded-data

MongoDB Inc. (2025). *MongoDB Aggregation Pipeline*. https://www.mongodb.com/docs/manual/core/aggregation-pipeline

Mongoose. (2025). *Mongoose v8.x — Schema Guide*. https://mongoosejs.com/docs/guide.html

Elmasri, R., & Navathe, S. B. (2015). *Fundamentals of Database Systems* (7e éd.). Pearson. ISBN 978-0133970777.

Stripe Inc. (2026). *Stripe API — PaymentIntent metadata*. https://stripe.com/docs/api/payment_intents/object#payment_intent_object-metadata

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216
