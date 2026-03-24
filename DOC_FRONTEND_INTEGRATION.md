# 📚 Documentation d'Intégration — StreamMG (Web & Mobile)

Cette documentation est destinée aux développeurs Frontend (React/Next.js) et Mobile (React Native/Expo). Elle décrit comment consommer l'API StreamMG de manière sécurisée et performante.

---

## 🔗 Informations Générales
- **Base URL (Développement) :** `http://localhost:3001/api`
- **Format global de réponse :**
  ```json
  {
    "success": true, // ou false en cas d'erreur
    "message": "Texte descriptif (optionnel)",
    "code": "CODE_ERREUR_SPECIFIQUE" // (optionnel, en cas de success=false)
  }
  ```

---

## 🔐 1. Authentification (JWT & Refresh Token)

Le backend utilise un système à double jeton : un **Access Token (JWT court, 15 min)** et un **Refresh Token (long, 7 jours)** avec rotation systématique à chaque utilisation.

### 1.1 Inscription (`POST /auth/register`)
- **Body :** `{ "username": "...", "email": "...", "password": "..." }`
- **Réponse (201) :** Retourne `token` (JWT d'accès), `user` et `refreshToken`.
- **Note Web :** Le `refreshToken` est aussi envoyé via un cookie `httpOnly` automatique.

### 1.2 Connexion (`POST /auth/login`)
- **Body :** `{ "email": "...", "password": "..." }`
- **Réponse (200) :** `{ "token": "...", "refreshToken": "...", "user": {...} }`
- **Action Mobile :** Stocker le `token` en mémoire vive (Redux/Zustand) et le `refreshToken` dans `Expo SecureStore`.
- **Action Web :** Stocker le `token` en mémoire vive. Le cookie gère le refresh token.

### 1.3 Rotation du Token (`POST /auth/refresh`)
⚠️ *À appeler lorsque le serveur renvoie une erreur `401 Unauthorized`.*
- **Header Mobile :** `x-refresh-token: <VOTRE_REFRESH_TOKEN>` *ou* envoyé dans le **Body** `{ "refreshToken": "..." }`.
- **Web :** Rien à envoyer, le cookie `httpOnly` fait le travail.
- **Réponse (200) :** Retourne vos NOUVEAUX `token` et `refreshToken`.
- **Action critique :** Écraser immédiatement l'ancien `refreshToken` par le nouveau en mémoire sécurisée. L'ancien est détruit côté serveur.

### 1.4 Déconnexion (`POST /auth/logout`)
Détruit le refresh token côté serveur et vide le cookie (Web).

---

## 🎬 2. Catalogue de Contenus

Ces routes ne nécessitent pas de JWT, ou peuvent en prendre un de manière optionnelle (pour le suivi de l'historique futur).

- **Tous les contenus paginés :** `GET /contents?page=1&limit=10&category=film`
- **À l'affiche (Featured) :** `GET /contents/featured`
- **Tendances (Trending) :** `GET /contents/trending` (Basé sur le `viewCount`)
- **Détail d'un contenu :** `GET /contents/:id`

---

## 🛡️ 3. Jouer une Vidéo / Audio (HLS Sécurisé) — CRITIQUE

Vous **ne pouvez pas** accéder directement à un fichier `.mp4`. Tout passe par le streaming HLS (`.m3u8` et `.ts`), protégé par un token cryptographique (`HMAC-SHA256`).

### 3.1 Obtenir le Token HLS
Avant de lancer le lecteur vidéo, vous devez demander l'autorisation.
- **Route :** `GET /hls/:contentId/token` (Nécessite le JWT `Authorization: Bearer <token>`)
- **Réponse (200) :** `{ "hlsToken": "eyJhbGciOiJIUzI... (valide 10 minutes)" }`

### 3.2 Lancer le Player (Ex: `expo-av` ou `video.js`)
L'URL source de la vidéo devient :
```text
http://localhost:3001/hls/<contentId>/index.m3u8?token=<hlsToken>
```
*Si le token expire pendant le visionnage, seul `index.m3u8` exige un nouveau token. Les segments `.ts` mis en cache par le lecteur continueront de jouer.*

---

## 📤 4. Upload de Fichiers (Réservé au rôle `provider`)

L'upload exige impérativement un objet `FormData` (Multipart) car vous envoyez des fichiers physiques.
**Attention (RÈGLE-03) :** Une image `thumbnail` est obligatoire, sinon le serveur rejettera l'upload sur-le-champ (400 Bad Request).

### Exemple d'implémentation (Axios / Fetch)
```javascript
const formData = new FormData();

// Champs du modèle Content
formData.append('title', 'Mon super Film');
formData.append('description', 'Description détaillée...');
formData.append('type', 'video'); // ou 'audio'
formData.append('category', 'film');
formData.append('language', 'mg'); // 'mg', 'fr', ou 'bilingual'
formData.append('accessType', 'free'); // 'free', 'premium', 'paid'

// Fichiers physiques (URIs sur Mobile, File/Blob sur Web)
// 1. La vignette OBLIGATOIRE
formData.append('thumbnail', {
  uri: 'file:///chemin/image.jpg',
  type: 'image/jpeg',
  name: 'cover.jpg'
});

// 2. Le média (MP4 ou MP3)
formData.append('media', {
  uri: 'file:///chemin/video.mp4',
  type: 'video/mp4',
  name: 'film.mp4'
});

// Requête
await axios.post('http://localhost:3001/api/provider/contents', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## 💳 5. Paiements & Monétisation (Stripe)

### 5.1 Vérifier l'accès
Si l'utilisateur clique sur un film et que le serveur répond `403 Forbidden` (`code: "PREMIUM_REQUIRED"` ou `"PURCHASE_REQUIRED"`), vous devez afficher le paywall.

### 5.2 Souscrire au Premium
- **Action :** `POST /payment/subscribe` avec `{ "plan": "monthly" }` ou `"yearly"`.
- **Réponse :** `{ "clientSecret": "pi_xxxxxxxx_secret_yyyy" }`
- Lancer le SDK Stripe (`@stripe/stripe-react-native` ou `Stripe.js`) avec ce `clientSecret` pour ouvrir la popup de carte bleue de test.

### 5.3 Achat unitaire (VOD)
- **Action :** `POST /payment/purchase` avec `{ "contentId": "..." }`.
- Même flux : ouvre Stripe avec le `clientSecret`. Si succès, le contenu est débloqué à vie pour cet utilisateur.

---

## 🛠️ Outils Recommandés pour Front/Mobile
- **Intercepteur HTTP (Axios) :** Créez un intercepteur qui surveille les erreurs `401`. Dès qu'un 401 arrive, l'intercepteur doit se mettre en pause, appeler `/auth/refresh` silencieusement, mettre à jour le token en mémoire, puis re-tenter la requête d'origine.
- **Formulaire d'Upload :** Surveillez la progression de l'upload via `onUploadProgress` d'Axios pour afficher une barre de chargement au "Provider", car les vidéos peuvent peser jusqu'à 500 Mo.
