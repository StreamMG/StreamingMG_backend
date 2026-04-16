# Répartition des Rôles et Planning — StreamMG

**Document :** Organisation de l'équipe, responsabilités et planning  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026

---

## 1. Principe d'organisation

L'équipe de trois membres adopte une spécialisation par couche technique, reproduisant le modèle des équipes de développement professionnelles. Le **Membre 3** produit en semaine 1 le contrat d'API complet — signature de tous les endpoints, formats de requête/réponse, codes d'erreur, schémas MongoDB (avec `thumbnail` obligatoire et `hlsPath`) — permettant aux Membres 1 et 2 de développer en parallèle avec des réponses mockées.

---

## 2. Responsabilités détaillées

### Membre 1 — Développeur Frontend Mobile (38 %)

**Domaine :** Application React Native + Expo SDK 52

Le Membre 1 est responsable de l'intégralité de l'application mobile. Navigation (expo-router), écrans d'authentification avec session persistante (expo-secure-store), catalogue avec affichage des vignettes obligatoires dans les ContentCards (FlatList optimisée, lazy loading, placeholder pendant le chargement), lecteurs vidéo (expo-av en portrait et paysage automatique) et audio (expo-av avec mini-player persistant au-dessus de la tab bar, affichant la pochette/coverArt ou la vignette), playlists, historique, profil.

**Protection des contenus — AES-256-GCM.** Le Membre 1 implémente l'intégralité du flux de téléchargement sécurisé : appel à POST /api/download/:contentId pour récupérer la clé AES-256, l'IV et l'URL signée ; téléchargement du fichier par chunks (4–8 Mo) via expo-file-system avec indicateur de progression et reprise automatique sur coupure réseau ; chiffrement immédiat de chaque chunk avec react-native-quick-crypto (AES-256-GCM) ; sauvegarde du fichier `.enc` dans le sandbox privé ; stockage sécurisé de la clé et de l'IV dans expo-secure-store. Lecture hors-ligne : déchiffrement en mémoire vive chunk par chunk, flux envoyé à expo-av sans écriture de fichier en clair.

**Modèle économique.** Écrans intermédiaires d'accès (subscription_required, purchase_required, login_required), flux d'achat Stripe mobile (CardField natif @stripe/stripe-react-native), interfaces de tutoriels avec progression.

**Espace fournisseur mobile.** Formulaire d'upload avec sélecteur d'image obligatoire (expo-image-picker), aperçu de la vignette avant soumission, bouton "Soumettre" désactivé sans image.

### Membre 2 — Développeur Frontend Web (32 %)

**Domaine :** Application React.js 18 + Vite 5

Le Membre 2 est responsable de l'intégralité de l'application web. Navigation SPA (react-router-dom), écrans d'authentification avec cookie httpOnly, catalogue avec vignettes obligatoires dans les ContentCards (affichage en grille responsive, lazy loading natif HTML), lecteurs, mini-player persistant (App.tsx hors RouterProvider), playlists, historique, profil.

**Protection des contenus — HLS + tokens signés.** Le Membre 2 intègre hls.js dans react-player pour la lecture vidéo. Avant chaque lecture, il appelle GET /api/hls/:contentId/token pour récupérer l'URL du manifest signé, puis configure hls.js avec cette URL. hls.js gère automatiquement les requêtes de segments `.ts` avec le token dans l'URL. Si hls.js rapporte une erreur 403 sur un segment, le frontend redemande un nouveau token et relance la lecture. Les contenus audio restent servis en fichiers directs (pas de HLS) — le Service Worker met en cache les audios (Cache First, expiration 48h).

**Modèle économique.** Mêmes écrans intermédiaires que le mobile, flux Stripe Elements, pages de tutoriels avec barre de progression globale.

**Espace fournisseur web.** Formulaire d'upload complet : sélecteur d'image (champ `<input type="file" accept="image/jpeg,image/png">`), aperçu avant soumission, champ `thumbnail` obligatoire avec validation côté client, champ de prix conditionnel (si "Payant"), gestionnaire de leçons pour les tutoriels (ajout, réordonnancement glisser-déposer, suppression).

### Membre 3 — Développeur Backend + Coordination (30 %)

**Domaine :** API REST Node.js/Express + MongoDB + Sécurité + Infrastructure

Le Membre 3 produit en semaine 1 le contrat d'API complet. Il est responsable de l'intégralité du backend.

**Pipeline de protection vidéo — HLS.** Après chaque upload vidéo (Multer), un pipeline ffmpeg (fluent-ffmpeg) découpe le fichier source en segments HLS de 10 secondes et génère le manifest `index.m3u8` dans `/uploads/hls/<contentId>/`. Le fichier source est déplacé dans `/uploads/private/` (non accessible publiquement). Le middleware `hlsTokenizer` génère les tokens signés avec fingerprint et les vérifie à chaque requête de segment.

**Pipeline de protection mobile — AES-256-GCM.** L'endpoint POST /api/download/:contentId génère une clé AES-256 et un IV via `crypto.randomBytes` (Node.js natif), signe une URL temporaire (15 min) vers le fichier source, et retourne `{ aesKeyHex, ivHex, signedUrl }`. La clé n'est jamais stockée en base de données.

**Multer — vignette obligatoire.** Configuration `upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'media', maxCount: 1 }])`. Middleware intermédiaire vérifiant `req.files?.thumbnail` avec rejet 400 si absent. Types MIME autorisés : image/jpeg, image/png (≤ 5 Mo). music-metadata extrait automatiquement les métadonnées ID3 des audios (titre, artiste, durée, `coverArt`) — distinct de la vignette catalogue.

**Collections MongoDB.** 8 collections avec schémas Mongoose (thumbnail `required: true` dans `contents`, hlsPath, champs AES), index optimisés, contraintes d'unicité (purchases, refreshTokens).

**Stripe.** Routes /api/payment/subscribe et /api/payment/purchase, webhook distinguant `metadata.type === "purchase"` de `metadata.type === "subscription"`, idempotence via index unique `{ userId, contentId }` dans `purchases`.

**Sécurité.** JWT HS256 15 min, rotation refresh tokens, bcrypt coût 12, helmet, CORS (2 origines), rate-limit (10 req/15min auth, 200 req/15min autres), express-validator.

**Infrastructure.** MongoDB Atlas, Railway (backend), Nginx (reverse proxy + SSL Let's Encrypt), Vercel (frontend web + rewrite SPA), Postman (collection exportée).

---

## 3. Planning prévisionnel — 10 semaines

| Semaine | Membre 1 — Mobile | Membre 2 — Web | Membre 3 — Backend |
|---|---|---|---|
| **S1** | Init Expo, structure expo-router, maquettes Figma (vignettes partout) | Init Vite + Tailwind, structure SPA, maquettes Figma (vignettes partout) | **Contrat d'API complet** (thumbnail obligatoire, hlsPath, endpoints HLS + download), schémas Mongoose, init Express |
| **S2** | ContentCard avec vignette (FlatList lazy loading), navigation tab bar | ContentCard avec vignette (grille responsive), navigation SPA | Auth JWT + refresh token, Multer (thumbnail OBLIGATOIRE + vidéo/audio), validation MIME/taille |
| **S3** | Écrans auth, zustand authStore, session expo-secure-store | Pages auth, zustand authStore, session cookie httpOnly | Routes /contents, pipeline ffmpeg → HLS (fluent-ffmpeg), indexation MongoDB |
| **S4** | Catalogue + badges niveaux d'accès, recherche, filtres | Catalogue + badges niveaux d'accès, recherche, filtres | Middleware `hlsTokenizer` (génération + vérification token + fingerprint), `checkAccess` |
| **S5** | expo-av (vidéo + audio), paysage, mini-player (vignette dans pochette), tokens HLS | hls.js + react-player, mini-player App.tsx (vignette pochette), tokens HLS | Routes /history, /tutorial/progress, déploiement staging Railway + Nginx |
| **S6** | **Téléchargement AES-256-GCM** (react-native-quick-crypto + expo-file-system chunks + reprise) | Service Worker PWA (audio Cache First 48h), installation PWA | **Endpoint /download** (crypto.randomBytes clé AES-256 + IV, URL signée 15 min) |
| **S7** | **Lecture hors-ligne** (déchiffrement mémoire, expo-secure-store), Stripe CardField | Stripe Elements, écrans intermédiaires (premium / payant / login) | Stripe subscribe + purchase (PaymentIntent + metadata.type), webhook handler |
| **S8** | Écrans intermédiaires, tutoriels (progression, vignettes), formulaire fournisseur (expo-image-picker) | Formulaire fournisseur (upload vignette obligatoire, gestionnaire leçons), admin web | Routes admin + provider (validation thumbnail), statistiques, Postman collection |
| **S9** | Tests mobile (vignettes, AES, HLS, Stripe, tutoriels), corrections | Tests web (vignettes, HLS, fingerprint, PWA, Stripe, 360 px), corrections | Tests sécurité (tokens HLS, fingerprint, AES endpoint, webhook, rate-limit), corrections |
| **S10** | Préparation démonstration mobile, contribution mémoire | Préparation démonstration web, contribution mémoire | Finalisation mémoire + slides, déploiement production final |

### Dépendances critiques

Le **contrat d'API complet (S1, Membre 3)** est le prérequis absolu. Les Membres 1 et 2 mockent les réponses pendant S2–S4.

Le **middleware `hlsTokenizer` (S4, Membre 3)** est requis par les Membres 1 et 2 pour intégrer la lecture vidéo (S5). En attendant, ils utilisent des vidéos mockées servies normalement en test.

L'**endpoint /download (S6, Membre 3)** est requis par le Membre 1 pour le chiffrement AES mobile (S6–S7).

---

## 4. Références bibliographiques

Brooks, F. P. (1975). *The Mythical Man-Month: Essays on Software Engineering*. Addison-Wesley. ISBN 978-0201835953.

Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide*. Scrum.org. https://scrumguides.org

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216

Expo. (2025). *react-native-quick-crypto*. https://github.com/margelo/react-native-quick-crypto
