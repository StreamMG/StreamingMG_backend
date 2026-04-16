# 📖 Documentation de l'API — StreamMG

**Version :** 1.0  
**Date :** Février 2026  
**Base URL (production) :** `https://api.streamMG.railway.app/api`  
**Base URL (développement) :** `http://localhost:3001/api`  
**Format :** JSON exclusivement  
**Auth :** Header `Authorization: Bearer <JWT>` pour toutes les routes protégées

> **Note cross-platform :** Le mobile (React Native/Expo) et le web (React.js/Vite) consomment la **même API REST**. Les comportements, réponses et codes d'erreur sont identiques sur les deux plateformes. Seul le stockage du refresh token diffère : cookie `httpOnly` sur web, `expo-secure-store` sur mobile.

---

## 🛡️ Types Communs & Codes d'Erreur

### Codes HTTP standard

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Ressource créée |
| `400` | Données invalides (vignette absente, MIME incorrect, champ manquant) |
| `401` | Token absent, expiré ou invalide |
| `403` | Accès refusé (rôle insuffisant, contenu protégé, token HLS invalide) |
| `404` | Ressource introuvable |
| `409` | Conflit (email dupliqué, achat déjà effectué) |
| `429` | Rate limit dépassé |
| `500` | Erreur serveur interne |

### Format d'erreur 403 — Middleware `checkAccess`

Renvoyé lorsqu'un utilisateur tente d'accéder à un contenu sans les droits requis. Les deux frontends interceptent ce format via l'intercepteur axios et affichent l'écran intermédiaire approprié.

```json
{
  "reason": "subscription_required" | "purchase_required" | "login_required",
  "price": 800000
}
```

### Niveaux d'accès (`accessType`)

| Valeur | Description |
|---|---|
| `"free"` | Accessible à tous, sans compte |
| `"premium"` | Abonnement Premium requis |
| `"paid"` | Achat unitaire requis — indépendant de l'abonnement |

### Rôles utilisateur (`role`)

| Valeur | Permissions |
|---|---|
| `"user"` | Contenus gratuits + achats unitaires |
| `"premium"` | Contenus gratuits + premium + achats unitaires |
| `"provider"` | Upload et gestion de ses propres contenus |
| `"admin"` | Accès total |

---

## 🔐 Écran : Authentification

Cette section couvre l'inscription, la connexion, le renouvellement de session et la déconnexion. Ces écrans sont présents sur mobile et web avec un comportement identique.

---

### 1. Inscription

- **Description :** Crée un nouveau compte utilisateur. Le mot de passe est haché avec bcrypt (coût 12). Le rôle par défaut est `"user"`, `isPremium` est `false`.
- **Requête :** `POST /auth/register`
- **Accès :** Public
- **Rate limit :** 10 requêtes / 15 min par IP

**Body (JSON) :**
```json
{
  "username": "Rabe",
  "email": "rabe@exemple.mg",
  "password": "MotDePasse1"
}
```

**Contraintes de validation :**
- `username` : 3–30 caractères, alphanumérique
- `email` : format email valide
- `password` : minimum 8 caractères

**Réponse (201 Created) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65f3a2b4c8e9d1234567890a",
    "username": "Rabe",
    "email": "rabe@exemple.mg",
    "role": "user",
    "isPremium": false
  }
}
```

**Erreurs :**
- `409` — `{ "message": "Email déjà utilisé", "code": "EMAIL_DUPLICATE" }`
- `400` — `{ "message": "Mot de passe trop faible (minimum 8 caractères)", "code": "WEAK_PASSWORD" }`

---

### 2. Connexion

- **Description :** Authentifie l'utilisateur et retourne un JWT (durée 15 min) et un refresh token (durée 7 jours). Le refresh token est émis en cookie `httpOnly` sur web et doit être stocké dans `expo-secure-store` sur mobile.
- **Requête :** `POST /auth/login`
- **Accès :** Public
- **Rate limit :** 10 requêtes / 15 min par IP

**Body (JSON) :**
```json
{
  "email": "rabe@exemple.mg",
  "password": "MotDePasse1"
}
```

**Réponse (200 OK) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65f3a2b4c8e9d1234567890a",
    "username": "Rabe",
    "role": "premium",
    "isPremium": true,
    "premiumExpiry": "2026-03-15T00:00:00.000Z"
  }
}
```

> **Web :** le refresh token est automatiquement placé dans le cookie `httpOnly` par le serveur.  
> **Mobile :** le refresh token est retourné dans le corps de la réponse et stocké manuellement dans `expo-secure-store`.

**Réponse mobile (200 OK) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "d4f8a2c1e9b3...",
  "user": { "...": "..." }
}
```

**Erreurs :**
- `401` — `{ "message": "Email ou mot de passe incorrect", "code": "INVALID_CREDENTIALS" }`
- `429` — `{ "message": "Trop de tentatives. Réessayez dans 15 minutes.", "code": "RATE_LIMIT" }`

---

### 3. Renouvellement du JWT (Refresh)

- **Description :** Émet un nouveau JWT et invalide l'ancien refresh token (rotation systématique). Appelé automatiquement par l'intercepteur axios en cas de 401.
- **Requête :** `POST /auth/refresh`
- **Accès :** Cookie `httpOnly` (web) ou refresh token dans le body (mobile)

**Body (JSON — mobile uniquement) :**
```json
{
  "refreshToken": "d4f8a2c1e9b3..."
}
```

**Réponse (200 OK) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> **Mobile :** un nouveau `refreshToken` est également retourné dans le body et doit remplacer l'ancien dans `expo-secure-store`.

**Erreurs :**
- `401` — `{ "message": "Refresh token invalide ou expiré", "code": "INVALID_REFRESH_TOKEN" }`

---

### 4. Déconnexion

- **Description :** Invalide le refresh token en base. Le JWT côté client doit être supprimé de la mémoire (zustand store).
- **Requête :** `POST /auth/logout`
- **Accès :** JWT requis

**Réponse (200 OK) :**
```json
{
  "message": "Déconnecté avec succès"
}
```

---

## 🏠 Écran : Catalogue (Accueil)

Écran principal affiché à tous les utilisateurs (visiteurs inclus). Chaque contenu affiché possède obligatoirement une vignette (`thumbnail` jamais null). Les badges visuels indiquent le niveau d'accès.

---

### 1. Lister les contenus (catalogue paginé)

- **Description :** Retourne la liste paginée des contenus publiés, avec filtres optionnels. Chaque item contient sa vignette obligatoire.
- **Requête :** `GET /contents`
- **Accès :** Public

**Paramètres de requête :**
```
?page=1             Numéro de page (défaut : 1)
&limit=20           Items par page (défaut : 20, max : 50)
&type=video|audio   Filtrer par type
&category=salegy|hira_gasy|tsapiky|beko|film|documentaire|podcast|tutoriel
&accessType=free|premium|paid
&isTutorial=true|false
&search=salegy      Recherche textuelle (titre, artiste, description)
```

**Réponse (200 OK) :**
```json
{
  "contents": [
    {
      "_id": "65f3a2b4c8e9d1234567890b",
      "title": "Mora Mora",
      "type": "audio",
      "category": "salegy",
      "thumbnail": "/uploads/thumbnails/mora_mora_e1f4a.jpg",
      "duration": 243,
      "accessType": "free",
      "price": null,
      "isTutorial": false,
      "artist": "Tarika Sammy",
      "viewCount": 1842,
      "isPublished": true
    },
    {
      "_id": "65f3a2b4c8e9d1234567890c",
      "title": "Ny Fitiavana",
      "type": "video",
      "category": "film",
      "thumbnail": "/uploads/thumbnails/ny_fitiavana_cover_b7c2d.jpg",
      "duration": 5820,
      "accessType": "paid",
      "price": 800000,
      "isTutorial": false,
      "artist": null,
      "viewCount": 412,
      "isPublished": true
    }
  ],
  "total": 148,
  "page": 1,
  "pages": 8
}
```

> **Note :** `thumbnail` est toujours présent et non null. Aucun contenu sans vignette ne peut être publié.

---

### 2. Contenus mis en avant

- **Description :** Retourne les contenus sélectionnés manuellement par l'administrateur pour la section "À la une".
- **Requête :** `GET /contents/featured`
- **Accès :** Public

**Réponse (200 OK) :**
```json
{
  "featured": [
    {
      "_id": "...",
      "title": "Hira Gasy — Grand Masoandro",
      "thumbnail": "/uploads/thumbnails/hira_gasy_gm_c8d3e.jpg",
      "type": "video",
      "accessType": "premium",
      "duration": 3600
    }
  ]
}
```

---

### 3. Contenus tendance (Top 10)

- **Description :** Retourne les 10 contenus les plus vus sur les 7 derniers jours.
- **Requête :** `GET /contents/trending`
- **Accès :** Public

**Réponse (200 OK) :**
```json
{
  "trending": [
    {
      "_id": "...",
      "title": "Tsapiky Mix 2026",
      "thumbnail": "/uploads/thumbnails/tsapiky_mix_f2a1b.jpg",
      "type": "audio",
      "accessType": "free",
      "viewCount": 5210,
      "rank": 1
    }
  ]
}
```

---

### 4. Détail d'un contenu

- **Description :** Retourne toutes les métadonnées d'un contenu. Ne retourne pas d'URL de lecture — celle-ci est obtenue via `/hls/:id/token`.
- **Requête :** `GET /contents/:id`
- **Accès :** Public

**Réponse (200 OK) :**
```json
{
  "_id": "65f3a2b4c8e9d1234567890b",
  "title": "Mora Mora",
  "description": "Un classique du salegy par Tarika Sammy...",
  "type": "audio",
  "category": "salegy",
  "thumbnail": "/uploads/thumbnails/mora_mora_e1f4a.jpg",
  "duration": 243,
  "accessType": "free",
  "price": null,
  "isTutorial": false,
  "artist": "Tarika Sammy",
  "album": "Novy",
  "language": "mg",
  "viewCount": 1842,
  "provider": {
    "_id": "...",
    "username": "TarikaSammyOfficial"
  },
  "createdAt": "2026-01-10T08:00:00.000Z"
}
```

**Erreurs :**
- `404` — `{ "message": "Contenu introuvable", "code": "CONTENT_NOT_FOUND" }`

---

### 5. Incrémenter le compteur de vues

- **Description :** Appelé automatiquement à chaque lecture (dès le démarrage du lecteur).
- **Requête :** `POST /contents/:id/view`
- **Accès :** Public

**Réponse (200 OK) :**
```json
{
  "viewCount": 1843
}
```

---

## ▶️ Écran : Lecteur Vidéo (Streaming HLS)

Le lecteur vidéo est protégé par HLS avec tokens signés. Aucun fichier `.mp4` complet n'est jamais servi directement. Sur web, `hls.js` gère la lecture des segments `.ts`. Sur mobile, `expo-av` reçoit l'URL du manifest signé.

---

### 1. Obtenir le token HLS (URL de lecture)

- **Description :** Vérifie les droits d'accès (`checkAccess`) et génère un token HLS signé valable 10 minutes, incluant un fingerprint de session. C'est le **premier appel** avant toute lecture vidéo.
- **Requête :** `GET /hls/:id/token`
- **Accès :** JWT + `checkAccess`
- **Headers :**
  - `X-Platform` *(Optionnel)* : `web` ou `mobile`. Par défaut `web`.
  - `X-Device-Id` *(Obligatoire si mobile)* : Identifiant unique de l'appareil (ex: `expo-device.osBuildId`).

**Réponse (200 OK) :**
```json
{
  "hlsUrl": "/hls/65f3a2b4c8e9d1234567890b/index.m3u8?token=eyJhbGci...",
  "expiresIn": 600
}
```

**Erreurs :**
- `401` — Token JWT absent ou invalide
- `403` — `{ "reason": "subscription_required" }` ou `{ "reason": "purchase_required", "price": 800000 }` ou `{ "reason": "login_required" }`
- `404` — Contenu introuvable

> **Web :** `hls.js` est configuré avec `hlsUrl`. En cas d'erreur 403 sur un segment, le frontend redemande automatiquement un token :
> ```javascript
> hls.on(Hls.Events.ERROR, async (event, data) => {
>   if (data.response?.code === 403) {
>     const { hlsUrl } = await api.get(`/hls/${contentId}/token`);
>     hls.loadSource(hlsUrl);
>   }
> });
> ```
>
> **Mobile :** `expo-av` reçoit `hlsUrl` directement comme source.

---

### 2. Manifest HLS

- **Description :** Retourne le manifest `index.m3u8` listant les segments `.ts`. Requiert le token dans l'URL.
  > **Note Architecture :** Si le token provient d'un client `mobile`, le backend interceptera la réponse pour réécrire dynamiquement le fichier et y coller le paramètre `?token=` à la fin de tous les noms de fichiers `.ts`.
- **Requête :** `GET /hls/:id/index.m3u8?token=<hlsToken>`
- **Accès :** Token HLS valide (généré par `/hls/:id/token`)

**Réponse (200 OK) :** Fichier `.m3u8` (text/plain)

**Erreurs :**
- `403` — Token absent, expiré, ou fingerprint invalide

---

### 3. Segment vidéo (.ts)

- **Description :** Retourne un segment vidéo de 10 secondes. 
  - Sur `web` le fingerprint est vérifié à **chaque requête** (User-Agent + IP + cookie `sessionId`), l'accès est bloqué par anti-aspiration en cas de copie.
  - Sur `mobile`, seul la signature cryptographique du JWT/HMAC est contrôlée à chaque segment, permettant d'esquiver la vérification IP pour les connexions mobiles volatiles.
- **Requête :** `GET /hls/:id/:segment?token=<hlsToken>`
- **Accès :** Token HLS valide (+ fingerprint correspondant exclusif web)

**Réponse (200 OK) :** Données binaires du segment (video/MP2T)

**Erreurs :**
- `403` — `{ "message": "Token HLS invalide ou fingerprint non correspondant", "code": "HLS_FORBIDDEN" }`

---

## 🎵 Écran : Lecteur Audio

L'audio est servi directement (pas de HLS). L'accès est contrôlé par `checkAccess`. Le mini-player reste visible lors de la navigation.

---

### 1. Obtenir l'URL de lecture audio

- **Description :** Vérifie les droits et retourne une URL signée temporaire (15 min) vers le fichier audio. Utilisée par `expo-av` (mobile) et `react-player` (web).
- **Requête :** `GET /audio/:id/url`
- **Accès :** JWT + `checkAccess`

**Réponse (200 OK) :**
```json
{
  "audioUrl": "https://api.streamMG.railway.app/uploads/audio/mora_mora_e1f4a.mp3?expires=...&sig=...",
  "expiresIn": 900,
  "metadata": {
    "title": "Mora Mora",
    "artist": "Tarika Sammy",
    "album": "Novy",
    "duration": 243,
    "coverArt": "/uploads/thumbnails/mora_mora_e1f4a.jpg"
  }
}
```

> `coverArt` correspond à la pochette extraite des métadonnées ID3 si disponible, sinon renvoie le champ `thumbnail` du contenu.

**Erreurs :**
- `403` — Même format que le lecteur vidéo (`reason`, `price`)
- `404` — `{ "message": "Contenu audio introuvable", "code": "AUDIO_NOT_FOUND" }`

---

## 📥 Écran : Téléchargement Hors-Ligne (Mobile uniquement)

Le téléchargement hors-ligne est disponible **uniquement sur mobile**. Le fichier est chiffré localement (AES-256-GCM) et illisible hors de l'application.

---

### 1. Initier un téléchargement sécurisé

- **Description :** Vérifie les droits d'accès, génère une clé AES-256 et un IV uniques pour ce téléchargement, et retourne une URL signée temporaire (15 min) vers le fichier source. La clé n'est **jamais stockée en base de données**.
- **Requête :** `POST /download/:id`
- **Accès :** JWT + `checkAccess`

**Réponse (200 OK) :**
```json
{
  "aesKeyHex": "a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  "ivHex": "b7c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6",
  "signedUrl": "https://api.streamMG.railway.app/private/ny_fitiavana_src.mp4?expires=...&sig=...",
  "expiresIn": 900
}
```

> **Implémentation mobile :**
> ```javascript
> const { aesKeyHex, ivHex, signedUrl } = await api.post(`/download/${contentId}`);
> // Téléchargement par chunks de 4-8 Mo via expo-file-system
> // Chiffrement chunk par chunk avec react-native-quick-crypto (AES-256-GCM)
> // Sauvegarde : FileSystem.documentDirectory + "offline/" + contentId + ".enc"
> await SecureStore.setItemAsync(`aes_${contentId}`, JSON.stringify({ aesKeyHex, ivHex }));
> ```

**Erreurs :**
- `403` — Droits insuffisants (même format `reason`)
- `409` — `{ "message": "Ce contenu est déjà téléchargé", "code": "ALREADY_DOWNLOADED" }` (la clé ne doit jamais être retransmise)

---

## 📚 Écran : Tutoriels

Les tutoriels sont des contenus organisés en séries de leçons ordonnées. La plateforme suit la progression de chaque utilisateur. Ils suivent le même système d'accès (`free`, `premium`, `paid`).

---

### 1. Leçons d'un tutoriel

- **Description :** Retourne la liste ordonnée des leçons d'un tutoriel.
- **Requête :** `GET /contents/:id/lessons`
- **Accès :** JWT + `checkAccess`

**Réponse (200 OK) :**
```json
{
  "tutorialId": "65f3a2b4c8e9d1234567890d",
  "title": "Apprendre le salegy — Cours débutant",
  "thumbnail": "/uploads/thumbnails/tuto_salegy_cover_a3f9b.jpg",
  "totalLessons": 6,
  "lessons": [
    {
      "index": 0,
      "title": "Introduction au rythme salegy",
      "duration": 480,
      "thumbnail": "/uploads/thumbnails/lesson_0_opt.jpg"
    },
    {
      "index": 1,
      "title": "Techniques de base à la guitare",
      "duration": 620,
      "thumbnail": null
    }
  ]
}
```

> La vignette du tutoriel (`thumbnail`) est obligatoire. Les vignettes de leçons sont optionnelles.

---

### 2. Enregistrer la progression d'une leçon

- **Description :** Marque une leçon comme complétée et met à jour le pourcentage de complétion. Appelé automatiquement lorsque l'utilisateur dépasse 90 % de la durée d'une leçon.
- **Requête :** `POST /tutorial/progress/:tutorialId`
- **Accès :** JWT requis

**Body (JSON) :**
```json
{
  "lessonIndex": 0,
  "completed": true
}
```

**Réponse (200 OK) :**
```json
{
  "tutorialId": "65f3a2b4c8e9d1234567890d",
  "completedLessons": [0],
  "percentComplete": 16.67,
  "lastLessonIndex": 0,
  "lastUpdatedAt": "2026-02-20T20:15:00.000Z"
}
```

---

### 3. Tutoriels en cours

- **Description :** Retourne les tutoriels non terminés de l'utilisateur, triés par date de dernière activité.
- **Requête :** `GET /tutorial/progress`
- **Accès :** JWT requis

**Réponse (200 OK) :**
```json
{
  "inProgress": [
    {
      "contentId": {
        "_id": "65f3a2b4c8e9d1234567890d",
        "title": "Apprendre le salegy",
        "thumbnail": "/uploads/thumbnails/tuto_salegy_cover_a3f9b.jpg"
      },
      "lastLessonIndex": 2,
      "percentComplete": 37.5,
      "lastUpdatedAt": "2026-02-20T20:15:00.000Z"
    }
  ]
}
```

---

## 📜 Écran : Historique de Lecture

---

### 1. Enregistrer une progression de lecture

- **Description :** Sauvegarde la position de lecture d'un utilisateur. Appelé toutes les 10 secondes pendant la lecture, et à la fermeture du lecteur.
- **Requête :** `POST /history/:contentId`
- **Accès :** JWT requis

**Body (JSON) :**
```json
{
  "progress": 142,
  "duration": 5820,
  "completed": false
}
```

> `progress` est la position en secondes. `completed` devient `true` à 90 % de la durée.

**Réponse (200 OK) :**
```json
{
  "message": "Progression enregistrée"
}
```

---

### 2. Récupérer l'historique

- **Description :** Retourne les contenus récemment regardés/écoutés, avec la position de reprise.
- **Requête :** `GET /history`
- **Accès :** JWT requis

**Réponse (200 OK) :**
```json
{
  "history": [
    {
      "_id": "...",
      "content": {
        "_id": "65f3a2b4c8e9d1234567890c",
        "title": "Ny Fitiavana",
        "thumbnail": "/uploads/thumbnails/ny_fitiavana_cover_b7c2d.jpg",
        "type": "video",
        "duration": 5820
      },
      "progress": 142,
      "completed": false,
      "watchedAt": "2026-02-19T14:30:00.000Z"
    }
  ]
}
```

---

## 💳 Écran : Abonnement Premium

---

### 1. Créer un abonnement Premium

- **Description :** Crée un `PaymentIntent` Stripe pour l'abonnement. Le `client_secret` est utilisé par Stripe Elements (web) ou CardField (mobile) pour finaliser le paiement.
- **Requête :** `POST /payment/subscribe`
- **Accès :** JWT requis

**Body (JSON) :**
```json
{
  "plan": "monthly" | "annual"
}
```

> Montants simulés : `monthly` = 500000 centimes (5 000 Ar), `annual` = 5000000 centimes (50 000 Ar).

**Réponse (200 OK) :**
```json
{
  "clientSecret": "pi_3Oq...secret_...",
  "amount": 500000,
  "currency": "mga"
}
```

**Erreurs :**
- `400` — `{ "message": "Plan invalide", "code": "INVALID_PLAN" }`
- `409` — `{ "message": "Vous avez déjà un abonnement actif", "code": "ALREADY_SUBSCRIBED" }`

---

### 2. Statut de l'abonnement Premium

- **Description :** Retourne le statut Premium de l'utilisateur connecté.
- **Requête :** `GET /payment/status`
- **Accès :** JWT requis

**Réponse (200 OK) :**
```json
{
  "isPremium": true,
  "premiumExpiry": "2026-03-15T00:00:00.000Z",
  "plan": "monthly"
}
```

---

## 🛒 Écran : Achat Unitaire (Contenu Payant)

L'achat unitaire est **indépendant de l'abonnement**. Un utilisateur Premium doit payer séparément les contenus de type `paid`. L'accès est permanent après achat.

---

### 1. Initier un achat unitaire

- **Description :** Crée un `PaymentIntent` Stripe pour un contenu payant. Vérifie l'absence d'un achat antérieur (idempotence).
- **Requête :** `POST /payment/purchase`
- **Accès :** JWT requis

**Body (JSON) :**
```json
{
  "contentId": "65f3a2b4c8e9d1234567890c"
}
```

**Réponse (200 OK) :**
```json
{
  "clientSecret": "pi_3Oq...secret_...",
  "amount": 800000,
  "currency": "mga",
  "contentTitle": "Ny Fitiavana"
}
```

**Erreurs :**
- `404` — `{ "message": "Contenu introuvable", "code": "CONTENT_NOT_FOUND" }`
- `409` — `{ "message": "Vous avez déjà acheté ce contenu", "code": "ALREADY_PURCHASED" }`

---

### 2. Liste des achats de l'utilisateur

- **Description :** Retourne tous les contenus achetés définitivement par l'utilisateur connecté.
- **Requête :** `GET /payment/purchases`
- **Accès :** JWT requis

**Réponse (200 OK) :**
```json
{
  "purchases": [
    {
      "_id": "...",
      "contentId": {
        "_id": "65f3a2b4c8e9d1234567890c",
        "title": "Ny Fitiavana",
        "thumbnail": "/uploads/thumbnails/ny_fitiavana_cover_b7c2d.jpg",
        "type": "video",
        "duration": 5820
      },
      "amount": 800000,
      "purchasedAt": "2026-02-15T16:22:10.000Z"
    }
  ]
}
```

---

### 3. Webhook Stripe (événements de paiement)

- **Description :** Reçoit les événements Stripe. La signature est vérifiée à chaque appel. Traite les deux types de paiements selon `metadata.type`.
- **Requête :** `POST /payment/webhook`
- **Accès :** Signature Stripe (header `stripe-signature`)

> **Logique de traitement :**
> ```javascript
> if (event.type === 'payment_intent.succeeded') {
>   const { metadata } = event.data.object;
>   if (metadata.type === 'subscription') {
>     // MAJ users : isPremium: true, role: "premium", premiumExpiry (J+30 ou J+365)
>     // Crée document dans transactions
>   } else if (metadata.type === 'purchase') {
>     // Crée document dans purchases :
>     // { userId, contentId, stripePaymentId, amount, purchasedAt: now }
>   }
> }
> ```

**Erreurs :**
- `400` — `{ "message": "Signature Stripe invalide", "code": "INVALID_STRIPE_SIGNATURE" }`

---

## 👤 Écran : Profil Utilisateur

---

### 1. Voir son profil

- **Description :** Retourne les informations du profil de l'utilisateur connecté.
- **Requête :** `GET /user/profile`
- **Accès :** JWT requis

**Réponse (200 OK) :**
```json
{
  "_id": "65f3a2b4c8e9d1234567890a",
  "username": "Rabe",
  "email": "rabe@exemple.mg",
  "role": "premium",
  "isPremium": true,
  "premiumExpiry": "2026-03-15T00:00:00.000Z",
  "createdAt": "2026-01-05T10:00:00.000Z",
  "stats": {
    "totalWatched": 42,
    "totalPurchases": 3,
    "tutorialsInProgress": 2
  }
}
```

---

### 2. Modifier le profil

- **Description :** Met à jour le nom d'utilisateur.
- **Requête :** `PATCH /user/profile`
- **Accès :** JWT requis

**Body (JSON) :**
```json
{
  "username": "RabeNew"
}
```

**Réponse (200 OK) :**
```json
{
  "_id": "...",
  "username": "RabeNew",
  "email": "rabe@exemple.mg"
}
```

**Erreurs :**
- `400` — `{ "message": "Nom d'utilisateur invalide", "code": "INVALID_USERNAME" }`
- `409` — `{ "message": "Nom d'utilisateur déjà pris", "code": "USERNAME_DUPLICATE" }`

---

### 3. Changer le mot de passe

- **Description :** Vérifie l'ancien mot de passe avant de le remplacer. Le nouveau mot de passe est haché avec bcrypt (coût 12).
- **Requête :** `PATCH /user/password`
- **Accès :** JWT requis

**Body (JSON) :**
```json
{
  "currentPassword": "AncienMotDePasse1",
  "newPassword": "NouveauMotDePasse2"
}
```

**Réponse (200 OK) :**
```json
{
  "message": "Mot de passe mis à jour avec succès"
}
```

**Erreurs :**
- `401` — `{ "message": "Mot de passe actuel incorrect", "code": "WRONG_PASSWORD" }`
- `400` — `{ "message": "Nouveau mot de passe trop faible", "code": "WEAK_PASSWORD" }`

---

## 📤 Écran : Espace Fournisseur

L'espace fournisseur est accessible aux utilisateurs avec le rôle `"provider"`. La vignette est **obligatoire** pour tout upload.

---

### 1. Déposer un nouveau contenu

- **Description :** Upload multipart d'un contenu avec sa vignette obligatoire. Après upload vidéo, `ffmpeg` découpe automatiquement en segments HLS. Le contenu est créé avec `isPublished: false` jusqu'à validation admin.
- **Requête :** `POST /provider/contents`
- **Accès :** JWT + rôle `provider`
- **Content-Type :** `multipart/form-data`

**Champs multipart :**
```
thumbnail    : fichier JPEG ou PNG, ≤ 5 Mo          ← OBLIGATOIRE
media        : fichier MP4 (vidéo) ou MP3/AAC (audio) ← OBLIGATOIRE
title        : string, 3–100 caractères
description  : string, max 1000 caractères
type         : "video" | "audio"
category     : "film" | "salegy" | "hira_gasy" | "tsapiky" | "beko" | "documentaire" | "podcast" | "autre"
language     : "mg" | "fr" | "en"
accessType   : "free" | "premium" | "paid"
price        : number (centimes, requis si accessType === "paid")
isTutorial   : boolean
```

**Réponse (201 Created) :**
```json
{
  "_id": "65f3a2b4c8e9d1234567890e",
  "title": "Cours de guitare salegy",
  "thumbnail": "/uploads/thumbnails/cours_salegy_3f9b2.jpg",
  "isPublished": false,
  "message": "Votre contenu a été soumis. Il sera visible après validation par l'administrateur."
}
```

**Erreurs :**
- `400` — `{ "message": "La vignette est obligatoire.", "code": "THUMBNAIL_REQUIRED" }`
- `400` — `{ "message": "Type MIME non autorisé (JPEG ou PNG uniquement)", "code": "INVALID_MIME_TYPE" }`
- `400` — `{ "message": "Fichier image trop volumineux (max 5 Mo)", "code": "FILE_TOO_LARGE" }`
- `400` — `{ "message": "Le prix est requis pour un contenu payant", "code": "PRICE_REQUIRED" }`

---

### 2. Lister ses contenus

- **Description :** Retourne uniquement les contenus appartenant au fournisseur connecté (publiés et en attente).
- **Requête :** `GET /provider/contents`
- **Accès :** JWT + rôle `provider`

**Réponse (200 OK) :**
```json
{
  "contents": [
    {
      "_id": "...",
      "title": "Cours de guitare salegy",
      "thumbnail": "/uploads/thumbnails/cours_salegy_3f9b2.jpg",
      "accessType": "free",
      "isPublished": false,
      "viewCount": 0,
      "createdAt": "2026-02-20T09:00:00.000Z"
    }
  ],
  "total": 5
}
```

---

### 3. Modifier les métadonnées d'un contenu

- **Description :** Met à jour le titre, la description, la catégorie et la langue. Toute modification soumet le contenu à une revalidation admin.
- **Requête :** `PUT /provider/contents/:id`
- **Accès :** JWT + rôle `provider` + propriétaire du contenu

**Body (JSON) :**
```json
{
  "title": "Cours de guitare salegy — Niveau débutant",
  "description": "Une nouvelle description...",
  "category": "salegy",
  "language": "mg"
}
```

**Réponse (200 OK) :**
```json
{
  "_id": "...",
  "title": "Cours de guitare salegy — Niveau débutant",
  "isPublished": false,
  "message": "Modifications soumises. Revalidation admin requise."
}
```

**Erreurs :**
- `403` — `{ "message": "Vous n'êtes pas propriétaire de ce contenu", "code": "FORBIDDEN" }`

---

### 4. Remplacer la vignette

- **Description :** Remplace la vignette d'un contenu existant. L'ancienne vignette est supprimée du serveur.
- **Requête :** `PUT /provider/contents/:id/thumbnail`
- **Accès :** JWT + rôle `provider` + propriétaire
- **Content-Type :** `multipart/form-data`

**Champs multipart :**
```
thumbnail : fichier JPEG ou PNG, ≤ 5 Mo   ← OBLIGATOIRE
```

**Réponse (200 OK) :**
```json
{
  "thumbnail": "/uploads/thumbnails/nouvelle_vignette_uuid.jpg"
}
```

---

### 5. Modifier le niveau d'accès et le prix

- **Description :** Change le niveau d'accès et/ou le prix. Soumet à revalidation admin.
- **Requête :** `PUT /provider/contents/:id/access`
- **Accès :** JWT + rôle `provider` + propriétaire

**Body (JSON) :**
```json
{
  "accessType": "paid",
  "price": 1000000
}
```

**Réponse (200 OK) :**
```json
{
  "accessType": "paid",
  "price": 1000000,
  "isPublished": false,
  "message": "Niveau d'accès modifié. Revalidation admin requise."
}
```

---

### 6. Gérer les leçons d'un tutoriel

- **Description :** Réorganise l'ordre des leçons (glisser-déposer côté frontend), ajoute ou supprime des leçons.
- **Requête :** `PUT /provider/contents/:id/lessons`
- **Accès :** JWT + rôle `provider` + propriétaire

**Body (JSON) :**
```json
{
  "lessons": [
    { "index": 0, "title": "Introduction", "mediaId": "65f...0a" },
    { "index": 1, "title": "Technique de base", "mediaId": "65f...0b" },
    { "index": 2, "title": "Exercice pratique", "mediaId": "65f...0c" }
  ]
}
```

**Réponse (200 OK) :**
```json
{
  "totalLessons": 3,
  "lessons": [ "..." ]
}
```

---

### 7. Supprimer un contenu

- **Description :** Supprime le contenu et tous les fichiers associés (vignette, segments HLS, audio).
- **Requête :** `DELETE /provider/contents/:id`
- **Accès :** JWT + rôle `provider` + propriétaire

**Réponse (200 OK) :**
```json
{
  "message": "Contenu supprimé avec succès"
}
```

---

## 🛠️ Écran : Administration

Accessible uniquement aux utilisateurs avec le rôle `"admin"`.

---

### 1. Lister tous les contenus (publiés et en attente)

- **Description :** Vue complète du catalogue incluant les contenus non publiés en attente de validation.
- **Requête :** `GET /admin/contents`
- **Accès :** JWT + rôle `admin`

**Paramètres de requête :**
```
?isPublished=true|false   Filtrer par statut de publication
&page=1&limit=20
```

**Réponse (200 OK) :**
```json
{
  "contents": [
    {
      "_id": "...",
      "title": "Cours de guitare salegy",
      "thumbnail": "/uploads/thumbnails/cours_salegy_3f9b2.jpg",
      "isPublished": false,
      "provider": { "_id": "...", "username": "TarikaSammyOfficial" },
      "createdAt": "2026-02-20T09:00:00.000Z"
    }
  ],
  "total": 312
}
```

---

### 2. Approuver / Rejeter un contenu

- **Description :** Publie ou rejette un contenu soumis par un fournisseur. En cas de rejet, un commentaire est obligatoire.
- **Requête :** `PUT /admin/contents/:id`
- **Accès :** JWT + rôle `admin`

**Body (JSON) — Approbation :**
```json
{
  "isPublished": true
}
```

**Body (JSON) — Rejet :**
```json
{
  "isPublished": false,
  "rejectionReason": "Vignette insuffisante — merci de fournir une image nette et représentative du contenu."
}
```

**Réponse (200 OK) :**
```json
{
  "_id": "...",
  "isPublished": true,
  "message": "Contenu publié avec succès"
}
```

---

### 3. Supprimer un contenu (admin)

- **Description :** Suppression administrative, sans restriction de propriété.
- **Requête :** `DELETE /admin/contents/:id`
- **Accès :** JWT + rôle `admin`

**Réponse (200 OK) :**
```json
{
  "message": "Contenu supprimé par l'administrateur"
}
```

---

### 4. Statistiques globales

- **Description :** Tableau de bord administrateur avec métriques de la plateforme et revenus simulés.
- **Requête :** `GET /admin/stats`
- **Accès :** JWT + rôle `admin`

**Réponse (200 OK) :**
```json
{
  "totalUsers": 284,
  "premiumUsers": 47,
  "totalContents": 312,
  "publishedContents": 287,
  "pendingContents": 25,
  "totalViews": 18420,
  "recentPurchases30d": 38,
  "revenueSimulated30d": 28500000,
  "topPurchasedContents": [
    {
      "title": "Ny Fitiavana",
      "thumbnail": "/uploads/thumbnails/ny_fitiavana_cover_b7c2d.jpg",
      "totalSales": 12,
      "totalRevenue": 9600000
    }
  ]
}
```

---

### 5. Gestion des utilisateurs

- **Description :** Liste tous les utilisateurs de la plateforme.
- **Requête :** `GET /admin/users`
- **Accès :** JWT + rôle `admin`

**Paramètres de requête :**
```
?role=user|premium|provider|admin
&page=1&limit=50
```

**Réponse (200 OK) :**
```json
{
  "users": [
    {
      "_id": "...",
      "username": "Rabe",
      "email": "rabe@exemple.mg",
      "role": "premium",
      "isPremium": true,
      "isActive": true,
      "createdAt": "2026-01-05T10:00:00.000Z"
    }
  ],
  "total": 284
}
```

---

### 6. Activer / Désactiver un utilisateur

- **Description :** Suspend ou réactive un compte utilisateur. Un utilisateur désactivé reçoit `401` à chaque connexion.
- **Requête :** `PUT /admin/users/:id`
- **Accès :** JWT + rôle `admin`

**Body (JSON) :**
```json
{
  "isActive": false
}
```

**Réponse (200 OK) :**
```json
{
  "_id": "...",
  "isActive": false,
  "message": "Compte utilisateur désactivé"
}
```

---

## 🔁 Intercepteur Axios — Gestion Cross-Platform des Erreurs

Ce code est **identique sur web et mobile**. Il gère le renouvellement automatique du JWT (401) et l'affichage des écrans intermédiaires d'accès (403).

```javascript
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    // Renouvellement JWT automatique
    if (error.response?.status === 401) {
      try {
        const { data } = await axiosInstance.post('/auth/refresh');
        tokenStore.setToken(data.token);
        error.config.headers['Authorization'] = `Bearer ${data.token}`;
        return axiosInstance.request(error.config);
      } catch {
        tokenStore.logout();
        navigate('/login'); // Web : react-router / Mobile : expo-router
      }
    }

    // Affichage de l'écran intermédiaire d'accès
    if (error.response?.status === 403) {
      const { reason, price } = error.response.data;
      // reason : "subscription_required" | "purchase_required" | "login_required"
      accessGateStore.show({ reason, price });
    }

    return Promise.reject(error);
  }
);
```

---

## 🗺️ Résumé des Routes

| Méthode | Route | Accès | Écran |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Inscription |
| `POST` | `/auth/login` | Public | Connexion |
| `POST` | `/auth/refresh` | Refresh token | Session |
| `POST` | `/auth/logout` | JWT | Session |
| `GET` | `/contents` | Public | Catalogue |
| `GET` | `/contents/featured` | Public | Catalogue |
| `GET` | `/contents/trending` | Public | Catalogue |
| `GET` | `/contents/:id` | Public | Détail contenu |
| `POST` | `/contents/:id/view` | Public | Lecteur |
| `GET` | `/contents/:id/lessons` | JWT + checkAccess | Tutoriels |
| `GET` | `/hls/:id/token` | JWT + checkAccess | Lecteur vidéo |
| `GET` | `/hls/:id/index.m3u8` | Token HLS | Lecteur vidéo |
| `GET` | `/hls/:id/:segment` | Token HLS + fingerprint | Lecteur vidéo |
| `GET` | `/audio/:id/url` | JWT + checkAccess | Lecteur audio |
| `POST` | `/download/:id` | JWT + checkAccess | Hors-ligne (mobile) |
| `POST` | `/history/:contentId` | JWT | Historique |
| `GET` | `/history` | JWT | Historique |
| `POST` | `/tutorial/progress/:id` | JWT | Tutoriels |
| `GET` | `/tutorial/progress` | JWT | Tutoriels |
| `GET` | `/user/profile` | JWT | Profil |
| `PATCH` | `/user/profile` | JWT | Profil |
| `PATCH` | `/user/password` | JWT | Profil |
| `POST` | `/payment/subscribe` | JWT | Abonnement |
| `GET` | `/payment/status` | JWT | Abonnement |
| `POST` | `/payment/purchase` | JWT | Achat unitaire |
| `GET` | `/payment/purchases` | JWT | Profil / Achats |
| `POST` | `/payment/webhook` | Signature Stripe | Interne |
| `POST` | `/provider/contents` | JWT + provider | Espace fournisseur |
| `GET` | `/provider/contents` | JWT + provider | Espace fournisseur |
| `PUT` | `/provider/contents/:id` | JWT + provider + owner | Espace fournisseur |
| `PUT` | `/provider/contents/:id/thumbnail` | JWT + provider + owner | Espace fournisseur |
| `PUT` | `/provider/contents/:id/access` | JWT + provider + owner | Espace fournisseur |
| `PUT` | `/provider/contents/:id/lessons` | JWT + provider + owner | Espace fournisseur |
| `DELETE` | `/provider/contents/:id` | JWT + provider + owner | Espace fournisseur |
| `GET` | `/admin/contents` | JWT + admin | Administration |
| `PUT` | `/admin/contents/:id` | JWT + admin | Administration |
| `DELETE` | `/admin/contents/:id` | JWT + admin | Administration |
| `GET` | `/admin/stats` | JWT + admin | Administration |
| `GET` | `/admin/users` | JWT + admin | Administration |
| `PUT` | `/admin/users/:id` | JWT + admin | Administration |

---

*Documentation générée pour le projet StreamMG — Licence 3 Génie Logiciel — Février 2026*
