# 📖 Référence API Exhaustive — StreamMG

Cette documentation détaille **chaque point d'accès (endpoint)** disponible pour l'application Mobile (React Native) et Web (React).

- **Base URL locale :** `http://localhost:3001/api`
- **Format global :** Le serveur renvoie toujours un objet JSON contenant au minimum `{ "success": true/false }`.

---

## 🔐 1. Authentification (`/api/auth`)

### 1.1 Inscription (Register)
- **URL :** `POST /api/auth/register`
- **Description :** Crée un nouvel utilisateur.
- **Body Requis (JSON) :**
  ```json
  {
    "username": "tsiky_user",
    "email": "tsiky@streammg.mg",
    "password": "MonMotDePasse123!"
  }
  ```

✅ **Réponse Succès (201 Created) :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...", // JWT valide 15min
  "refreshToken": "72f10b889373e...", // Token valide 7j (à stocker côté Mobile)
  "user": {
    "_id": "60d5ecb8b392d7...",
    "username": "tsiky_user",
    "role": "user",
    "isPremium": false,
    "premiumExpiry": null
  }
}
```

❌ **Erreur : Email ou Username déjà pris (409 Conflict) :**
```json
{
  "success": false,
  "message": "Email déjà utilisé",
  "code": "EMAIL_DUPLICATE"
}
```

---

### 1.2 Connexion (Login)
- **URL :** `POST /api/auth/login`
- **Description :** Connecte l'utilisateur et retourne les tokens.
- **Body Requis (JSON) :**
  ```json
  {
    "email": "tsiky@streammg.mg",
    "password": "MonMotDePasse123!"
  }
  ```

✅ **Réponse Succès (200 OK) :** *(Même format que Register, avec le profil complet).*

❌ **Erreur : Mauvais identifiants (401 Unauthorized) :**
```json
{
  "success": false,
  "message": "Identifiants incorrects",
  "code": "INVALID_CREDENTIALS"
}
```

---

### 1.3 Renouvellement de Session (Refresh Token) 🔄
- **URL :** `POST /api/auth/refresh`
- **Description :** Génère un nouveau JWT et fait tourner le Refresh Token.
- **Headers / Body (Mobile) :** 
  Envoyer le header `x-refresh-token: <VOTRE_REFRESH_TOKEN>`
  *OU* envoyer `{ "refreshToken": "<VOTRE_REFRESH_TOKEN>" }` dans le Body.
- **Web :** Le navigateur envoie automatiquement le cookie `refreshToken`, nul besoin du Header.

✅ **Réponse Succès (200 OK) :**
```json
{
  "token": "Nouveau_JWT...",
  "refreshToken": "Nouveau_Refresh_Token_A_Remplace_Dans_Expo_SecureStore"
}
```

❌ **Erreur : Session expirée ou Token volé (401 Unauthorized) :**
```json
{
  "success": false,
  "message": "Session expirée",
  "code": "INVALID_REFRESH_TOKEN"
}
```
*(Si vous recevez cette erreur, l'utilisateur doit être renvoyé sur l'écran de Login).*

---

### 1.4 Déconnexion (Logout)
- **URL :** `POST /api/auth/logout`
- **Headers Requis :** `Authorization: Bearer <TOKEN_JWT>` et optionnellement `x-refresh-token`.
- **Description :** Supprime le refresh token de la base MongoDB.

✅ **Réponse Succès (200 OK) :**
```json
{
  "message": "Déconnecté avec succès"
}
```

---

## 🎬 2. Catalogue de Contenus (`/api/contents`)

### 2.1 Lister les contenus (avec filtres & pagination)
- **URL :** `GET /api/contents?page=1&limit=10&category=film&accessType=free`
- **Headers :** Aucun (Optionnel : Send JWT pour inclure l'historique utilisateur plus tard).

✅ **Réponse Succès (200 OK) :**
```json
{
  "success": true,
  "contents": [
    {
      "_id": "60d5eca8b...",
      "title": "Malagasy Legends",
      "description": "Un documentaire...",
      "type": "video",
      "category": "film",
      "accessType": "premium",
      "duration": 5400,
      "viewCount": 12500,
      "thumbnailUrl": "/uploads/thumbnails/fb7e23a-malagasy.jpg",
      "createdAt": "2026-03-24T10:00:00.000Z"
    }
  ],
  "pagination": { "total": 45, "page": 1, "pages": 5 }
}
```

### 2.2 Voir le détail d'un contenu spécifique
- **URL :** `GET /api/contents/:contentId`
- **Headers :** `Authorization: Bearer <TOKEN_JWT>` fortement recommandé (Vérifie les droits d'accès au player).

✅ **Réponse Succès (200 OK) :**
```json
{
  "success": true,
  "content": {
    "_id": "60d5eca8b...",
    "title": "Malagasy Legends",
    "accessType": "premium",
    "hasAccess": true, // Calculé dynamiquement si JWT est fourni !
    "price": null,
    "...": "..."
  }
}
```

❌ **Erreur : Contenu introuvable (404 Not Found) :**
```json
{
  "success": false,
  "message": "Contenu introuvable",
  "code": "NOT_FOUND"
}
```

---

## 🛡️ 3. Sécurité Vidéo & Streaming (`/api/hls`) ⚠️ CRITIQUE

Avant de charger le Player Vidéo, vous devez prouver que l'utilisateur a le droit de voir ce film.

### 3.1 Générer un Token HLS temporaire (10 Minutes)
- **URL :** `GET /api/hls/:contentId/token`
- **Headers :** `Authorization: Bearer <TOKEN_JWT>` (Obligatoire).

✅ **Réponse Succès (200 OK) :**
*(L'utilisateur a un abonnement Premium actif, ou il a acheté le film, ou le film est gratuit).*
```json
{
  "hlsToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkhMUyJ9.eyJjb...",
  "hlsUrl": "/hls/60d5eca8b/index.m3u8?token=eyJhbG...",
  "expiresAt": 1711285034
}
```
*-> Vous donnez `hlsUrl` directement comme "source URI" dans l'application Expo (ex: `expo-av`).*

❌ **Erreur : Accès Rejeté (L'utilisateur est gratuit et demande un film payant) (403 Forbidden) :**
```json
{
  "success": false,
  "message": "Ce contenu nécessite un accès premium",
  "code": "PREMIUM_REQUIRED" 
}
```
*(Code `PURCHASE_REQUIRED` si `accessType = "paid"`).*

---

## 📤 4. Upload de Médias (Fournisseurs - Providers)

### 4.1 Envoyer un Film / Musique
- **URL :** `POST /api/provider/contents`
- **Headers Requis :** 
  - `Authorization: Bearer <TOKEN_JWT>` (Le user doit avoir le rôle `provider` ou `admin`)
  - `Content-Type: multipart/form-data`
- **Body :** Obligatoire `FormData`.

```javascript
// EXEMPLE JAVASCRIPT / FORMDATA
const fd = new FormData();
fd.append("title", "Test Upload");
fd.append("description", "...");
fd.append("type", "video");
fd.append("category", "film");
fd.append("language", "mg");

// Fichiers
fd.append("thumbnail", { uri: '...', type: 'image/jpeg', name: 'thumb.jpg' }); // OBLIGATOIRE
fd.append("media", { uri: '...', type: 'video/mp4', name: 'video.mp4' });
```

✅ **Réponse Succès (201 Created) :**
```json
{
  "message": "Contenu uploadé — En cours de traitement",
  "contentId": "65b90cdfe7..."
}
```

❌ **Erreur : Oubli de la Vignette (400 Bad Request) :**
```json
{
  "success": false,
  "message": "Une image 'thumbnail' (jpg/png) est requise pour cet upload",
  "code": "MISSING_THUMBNAIL"
}
```
❌ **Erreur : Fichier trop lourd (413 Payload Too Large) :**
```json
{
  "success": false,
  "message": "Fichier trop volumineux (500MB max)",
}
```

---

## 💳 5. Paiements Stripe (`/api/payment`)

### 5.1 Initier un Abonnement Premium
- **URL :** `POST /api/payment/subscribe`
- **Headers :** `Authorization: Bearer <TOKEN_JWT>`
- **Body :** `{ "plan": "monthly" }` ou `{ "plan": "yearly" }`

✅ **Réponse Succès (200 OK) :**
```json
{
  "clientSecret": "pi_3OgXQz..._secret_AbCdEf"
}
```
*-> Utilisez ce `clientSecret` avec le SDK Stripe Frontend (`confirmPayment`) pour afficher l'interface de carte bleue et valider.*

❌ **Erreur : Mauvais Plan Demande (400 Bad Request) :**
```json
{
  "success": false,
  "message": "Plan invalide. Utilisez monthly ou yearly."
}
```

### 5.2 Acheter un contenu VOD (Video on Demand)
- **URL :** `POST /api/payment/purchase`
- **Body :** `{ "contentId": "60d5eca..." }`

✅ **Réponse Succès (200 OK) :** Identique, retourne le `clientSecret`.

❌ **Erreur : L'utilisateur a déjà acheté le film (409 Conflict) :**
```json
{
  "success": false,
  "message": "Vous avez déjà acheté ce contenu",
  "code": "DUPLICATE_PURCHASE"
}
```
