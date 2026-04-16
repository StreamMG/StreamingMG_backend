# Contrat d'API — StreamMG

**Document :** Contrat d'API REST — référence de coordination inter-membres  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026  
**Producteur :** Membre 3 — Backend  
**Consommateurs :** Membre 1 (mobile), Membre 2 (web)

---

## 1. Principes généraux

**Base URL :** `https://api.streamMG.railway.app/api` (production) — `http://localhost:3001/api` (dev)  
**Format :** JSON exclusivement.  
**Auth :** header `Authorization: Bearer <JWT>`. Routes "Public" : aucun token requis.  
**Refresh token :** cookie httpOnly (web) ou expo-secure-store (mobile).

**Codes d'erreur standard :**

| Code | Signification |
|---|---|
| 400 | Données invalides (vignette absente, MIME incorrect, taille dépassée) |
| 401 | Token absent, expiré ou invalide |
| 403 | Accès refusé (rôle insuffisant, contenu protégé, token HLS invalide) |
| 404 | Ressource introuvable |
| 409 | Conflit (email dupliqué, achat déjà effectué) |
| 429 | Rate limit dépassé |
| 500 | Erreur serveur interne |

**Format 403 du middleware checkAccess :**
```json
{
  "reason": "subscription_required" | "purchase_required" | "login_required",
  "price": 800000
}
```

---

## 2. Authentification

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /auth/register | Public | Inscription |
| POST | /auth/login | Public | Connexion |
| POST | /auth/refresh | Cookie/SecureStore | Renouvellement JWT |
| POST | /auth/logout | JWT | Déconnexion |

**POST /auth/register**
```json
// Requête
{ "username": "Rabe", "email": "rabe@exemple.mg", "password": "MotDePasse1" }
// Réponse 201
{ "token": "eyJhb...", "user": { "_id": "...", "username": "Rabe", "role": "user", "isPremium": false } }
```

**POST /auth/login**
```json
// Requête
{ "email": "rabe@exemple.mg", "password": "MotDePasse1" }
// Réponse 200 + cookie httpOnly "refreshToken"
{ "token": "eyJhb...", "user": { "_id": "...", "username": "Rabe", "role": "premium", "isPremium": true } }
```

---

## 3. Catalogue

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | /contents | Public | Liste paginée avec filtres |
| GET | /contents/featured | Public | Contenus mis en avant |
| GET | /contents/trending | Public | Top 10 de la semaine |
| GET | /contents/:id | Public | Détail d'un contenu |
| POST | /contents/:id/view | Public | Incrémenter le compteur de vues |
| GET | /contents/:id/lessons | JWT + checkAccess | Leçons d'un tutoriel |

**GET /contents — paramètres**
```
?page=1&limit=20
?type=video|audio
?category=film|salegy|...
?accessType=free|premium|paid
?isTutorial=true|false
?search=salegy
```

**GET /contents — réponse**
```json
{
  "contents": [
    {
      "_id": "...",
      "title": "Mora Mora",
      "type": "audio",
      "category": "salegy",
      "thumbnail": "/uploads/thumbnails/mora_mora_e1f4a.jpg",
      "duration": 243,
      "accessType": "free",
      "price": null,
      "isTutorial": false,
      "artist": "Tarika Sammy",
      "viewCount": 1842
    }
  ],
  "total": 148,
  "page": 1,
  "pages": 8
}
```

**Note :** le champ `thumbnail` est toujours présent et non null dans chaque objet contenu. Tout contenu sans vignette ne peut pas être publié (contrainte backend).

---

## 4. Streaming HLS et téléchargement sécurisé

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | /hls/:id/token | JWT + checkAccess | Génère token HLS signé + URL manifest |
| GET | /hls/:id/index.m3u8 | Token HLS | Manifest HLS signé |
| GET | /hls/:id/:segment | Token HLS + fingerprint | Segment vidéo .ts (vérifié à chaque requête) |
| POST | /download/:id | JWT + checkAccess | Clé AES-256 + IV + URL signée pour mobile |

**GET /hls/:id/token — réponse**
```json
{
  "hlsUrl": "/hls/65f3a2b.../index.m3u8?token=eyJhbGci...",
  "expiresIn": 600
}
```

**POST /download/:id — réponse**
```json
{
  "aesKeyHex": "a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  "ivHex": "b7c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6",
  "signedUrl": "https://api.streamMG.railway.app/private/ny_fitiavana_src.mp4?expires=...&sig=...",
  "expiresIn": 900
}
```

**Logique frontend (Membre 2) — renouvellement token HLS :**
```javascript
// hls.js error handler
hls.on(Hls.Events.ERROR, async (event, data) => {
  if (data.response?.code === 403) {
    const { hlsUrl } = await api.get(`/hls/${contentId}/token`);
    hls.loadSource(hlsUrl);
  }
});
```

**Logique frontend (Membre 1) — téléchargement AES mobile :**
```javascript
const { aesKeyHex, ivHex, signedUrl } = await api.post(`/download/${contentId}`);
const key = Buffer.from(aesKeyHex, 'hex');
const iv  = Buffer.from(ivHex, 'hex');

// Téléchargement par chunks + chiffrement AES-256-GCM
const encUri = `${FileSystem.documentDirectory}offline/${contentId}.enc`;
// ... chunks téléchargés via expo-file-system, chiffrés avec react-native-quick-crypto
// clé et IV stockés dans expo-secure-store
await SecureStore.setItemAsync(`aes_${contentId}`, JSON.stringify({ aesKeyHex, ivHex }));
```

---

## 5. Historique et progression

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /history/:contentId | JWT | Enregistrer la progression |
| GET | /history | JWT | Historique de l'utilisateur |
| POST | /tutorial/progress/:contentId | JWT | Mise à jour progression tutoriel |
| GET | /tutorial/progress | JWT | Tutoriels en cours |

**GET /tutorial/progress — réponse**
```json
{
  "inProgress": [
    {
      "contentId": {
        "_id": "...",
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

## 6. Paiement

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /payment/subscribe | JWT | Abonnement Premium |
| POST | /payment/purchase | JWT | Achat unitaire |
| GET | /payment/purchases | JWT | Liste des achats |
| GET | /payment/status | JWT | Statut Premium |
| POST | /payment/webhook | Signature Stripe | Événements Stripe |

**POST /payment/purchase**
```json
// Requête
{ "contentId": "65f3a2b4c8e9d1234567890d" }
// Réponse 200
{ "clientSecret": "pi_3Oq...secret_..." }
// Réponse 409 — doublon
{ "message": "Vous avez déjà acheté ce contenu" }
```

**GET /payment/purchases — réponse**
```json
{
  "purchases": [
    {
      "_id": "...",
      "contentId": {
        "_id": "...",
        "title": "Ny Fitiavana",
        "thumbnail": "/uploads/thumbnails/ny_fitiavana_cover_b7c2d.jpg",
        "type": "video"
      },
      "amount": 800000,
      "purchasedAt": "2026-02-15T16:22:10.000Z"
    }
  ]
}
```

**POST /payment/webhook — logique de traitement**
```javascript
if (event.type === 'payment_intent.succeeded') {
  const { metadata } = event.data.object;
  if (metadata.type === 'subscription') {
    // MAJ users : isPremium: true, role: "premium", premiumExpiry
    // Crée document dans transactions
  } else if (metadata.type === 'purchase') {
    // Crée document dans purchases :
    // { userId: metadata.userId, contentId: metadata.contentId,
    //   stripePaymentId, amount, purchasedAt: now }
  }
}
```

---

## 7. Espace fournisseur

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | /provider/contents | JWT + provider | Upload (multipart — thumbnail OBLIGATOIRE) |
| GET | /provider/contents | JWT + provider | Ses contenus uniquement |
| PUT | /provider/contents/:id | JWT + provider + owner | Modifier les métadonnées |
| PUT | /provider/contents/:id/thumbnail | JWT + provider + owner | Remplacer la vignette |
| PUT | /provider/contents/:id/access | JWT + provider + owner | Modifier niveau d'accès et prix |
| PUT | /provider/contents/:id/lessons | JWT + provider + owner | Réorganiser les leçons |
| DELETE | /provider/contents/:id | JWT + provider + owner | Supprimer |

**POST /provider/contents — multipart fields :**
```
thumbnail : fichier image JPEG ou PNG, ≤ 5 Mo     ← OBLIGATOIRE
media     : fichier vidéo MP4 ou audio MP3/AAC     ← OBLIGATOIRE
title, description, type, category, language, accessType, price, ...
```

**Réponse 400 si thumbnail absent :**
```json
{ "message": "La vignette est obligatoire." }
```

**PUT /provider/contents/:id/thumbnail**
```
// Permet de remplacer la vignette d'un contenu existant
thumbnail : fichier image JPEG ou PNG, ≤ 5 Mo   ← OBLIGATOIRE
// Réponse 200
{ "thumbnail": "/uploads/thumbnails/<uuid>.jpg" }
```

---

## 8. Administration

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | /admin/contents | JWT + admin | Tous les contenus (publiés et non publiés) |
| PUT | /admin/contents/:id | JWT + admin | Modification complète |
| DELETE | /admin/contents/:id | JWT + admin | Suppression |
| GET | /admin/stats | JWT + admin | Statistiques + revenus simulés |
| GET | /admin/users | JWT + admin | Liste des utilisateurs |
| PUT | /admin/users/:id | JWT + admin | Activer / désactiver |

**GET /admin/stats — réponse**
```json
{
  "totalUsers": 284,
  "premiumUsers": 47,
  "totalContents": 312,
  "totalViews": 18420,
  "topPurchasedContents": [
    {
      "title": "Ny Fitiavana",
      "thumbnail": "/uploads/thumbnails/ny_fitiavana_cover_b7c2d.jpg",
      "totalSales": 12,
      "totalRevenue": 9600000
    }
  ],
  "recentPurchases30d": 38,
  "revenueSimulated30d": 28500000
}
```

---

## 9. Logique frontend — gestion des erreurs 403 et renouvellement JWT

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
      } catch {
        tokenStore.logout();
        navigate('/login');
      }
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

## 10. Références bibliographiques

Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* (Thèse de doctorat). University of California, Irvine.

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216

Stripe Inc. (2026). *Stripe API Reference — PaymentIntents*. https://stripe.com/docs/api/payment_intents

Stripe Inc. (2026). *Webhooks — Best practices*. https://stripe.com/docs/webhooks/best-practices

TanStack. (2025). *TanStack Query v5*. https://tanstack.com/query/latest

OWASP Foundation. (2023). *OWASP Top Ten 2023*. https://owasp.org/www-project-top-ten/

Martin, R. C. (2017). *Clean Architecture*. Prentice Hall. ISBN 978-0134494166.
