# Cahier des Charges — StreamMG

**Document :** Cahier des Charges Fonctionnel et Technique  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026  
**Rédigé par :** Équipe StreamMG  
**Niveau :** Licence 3 Génie Logiciel

---

## Table des matières

1. Présentation générale du projet
2. Contexte et problématique
3. Acteurs du système
4. Modèle économique et niveaux d'accès
5. Description fonctionnelle par module
6. Architecture technique
7. Base de données
8. Sécurité
9. Design et interfaces
10. Contraintes et exigences non fonctionnelles
11. Répartition des rôles
12. Planning prévisionnel
13. Livrables attendus
14. Références bibliographiques

---

## 1. Présentation générale du projet

### 1.1 Identification du projet

StreamMG est une plateforme numérique de streaming audiovisuel et éducatif dédiée aux contenus culturels et pédagogiques malgaches. Elle permet la diffusion de films, de musique traditionnelle (salegy, hira gasy, tsapiky, beko), de documentaires, de podcasts et de tutoriels organisés en séries de leçons.

La plateforme se compose de trois composants techniques distincts développés par une équipe de trois membres spécialisés.

**Application mobile** (Membre 1) : React Native + Expo SDK 52, iOS et Android, démonstration via Expo Go.

**Application web** (Membre 2) : React.js 18 + Vite 5, navigateurs modernes (Chrome, Firefox, Safari, Edge), installable comme PWA.

**API REST backend** (Membre 3) : Node.js 20 LTS + Express.js 4, source unique de vérité partagée entre les deux clients.

### 1.2 Périmètre du projet

Projet académique de groupe mené en parallèle des mémoires de Licence individuels. Le périmètre est délibérément délimité pour garantir un prototype fonctionnel et démontrable en soutenance, sans sacrifier la qualité technique.

---

## 2. Contexte et problématique

### 2.1 Situation culturelle et numérique à Madagascar

Madagascar possède un patrimoine audiovisuel exceptionnel : hira gasy, salegy, tsapiky, beko, documentaires, productions cinématographiques locales. Ce patrimoine reste absent des grandes plateformes internationales (Netflix, Spotify, YouTube Premium) dont les catalogues sont massivement occidentaux et les abonnements inaccessibles à une majorité de la population.

### 2.2 Contexte numérique malgache

Selon DataReportal (2025), Madagascar compte 18,2 millions de connexions mobiles actives (56,2 % de la population) mais seulement 6,6 millions d'internautes (20,4 %). Le mobile est le premier terminal numérique. La bande passante est inégale (4G coûteuse en ville, 3G/2G en zones rurales). Ces contraintes justifient : le mode hors-ligne avec téléchargement chiffré sur mobile, le streaming HLS adaptatif sur web, le dark mode par défaut (économie de batterie OLED), et le téléchargement par chunks pour les coupures réseau.

### 2.3 Problématique

StreamMG répond à deux besoins simultanés : donner aux créateurs culturels malgaches un canal de diffusion numérique structuré avec valorisation de leurs œuvres, et donner aux utilisateurs un accès organisé à leur culture selon leurs contraintes financières et de connectivité. La protection des contenus contre les téléchargements non autorisés est une condition de viabilité économique intégrée dès la conception.

---

## 3. Acteurs du système

### 3.1 Visiteur

Accède sans compte. Consulte le catalogue (vignettes, titres, descriptions) et lit uniquement les contenus gratuits. Pour tout autre contenu, voit un écran d'invitation à s'inscrire.

### 3.2 Utilisateur standard

Inscrit gratuitement (rôle "user"). Lit tous les contenus gratuits avec suivi de progression pour les tutoriels, crée des playlists, consulte son historique, écoute en hors-ligne (mobile : téléchargement AES-256 ; web : Service Worker audio), et achète des contenus payants à l'unité.

### 3.3 Utilisateur premium

Abonnement Premium actif (rôle "premium"). Tous les droits standard plus l'accès illimité aux contenus premium. Pour les contenus payants, doit procéder à un achat unitaire — l'abonnement ne couvre jamais les contenus "paid".

### 3.4 Fournisseur de contenu

Rôle "provider". Upload des contenus avec **vignette obligatoire**, définit le niveau d'accès et le prix, organise les tutoriels en séries de leçons. Ne peut accéder qu'à ses propres contenus. Toute soumission est validée par un administrateur avant publication.

### 3.5 Administrateur

Accès complet. Valide ou rejette les soumissions (y compris la qualité des vignettes), modifie les niveaux d'accès et les prix, consulte les statistiques, gère les comptes.

---

## 4. Modèle économique et niveaux d'accès

### 4.1 Les quatre niveaux d'accès

**Gratuit.** Accessible à tous sans inscription. Vitrine de la plateforme.

**Premium.** Accessible aux abonnés Premium (forfait mensuel 5 000 Ar fictif ou annuel 50 000 Ar fictif). Accès illimité pendant la durée de l'abonnement.

**Payant (achat unitaire).** Achat permanent indépendant de tout abonnement. Même un utilisateur Premium doit payer séparément. Une fois acheté, l'accès est permanent.

**Tutoriel.** Suit le niveau d'accès choisi par le fournisseur (gratuit, premium ou payant), avec en plus le suivi de progression en séries de leçons ordonnées.

### 4.2 Tableau des droits

| Type de contenu | Visiteur | Standard | Premium | Remarque |
|---|---|---|---|---|
| Gratuit | OUI | OUI | OUI | Sans restriction |
| Premium | NON | NON | OUI | Abonnement requis |
| Payant | NON | ACHAT | ACHAT | Indépendant de l'abonnement |
| Tutoriel gratuit | OUI | OUI | OUI | + progression trackée |
| Tutoriel premium | NON | NON | OUI | + progression trackée |
| Tutoriel payant | NON | ACHAT | ACHAT | + progression trackée |

### 4.3 Simulation des paiements

Stripe mode test exclusivement. Cartes : 4242 4242 4242 4242 (succès), 4000 0000 0000 9995 (refus).

---

## 5. Description fonctionnelle par module

### 5.1 Module Authentification

Inscription : nom d'utilisateur unique (3–30 caractères), email valide, mot de passe ≥ 8 caractères avec majuscule et chiffre. Validation en temps réel côté client. Backend : bcrypt coût 12, rôle "user", isPremium false.

JWT 15 min stocké en mémoire vive uniquement (zustand). Refresh token 7 jours avec rotation systématique : cookie httpOnly (web) ou expo-secure-store (mobile, même espace que la clé AES de chiffrement). Intercepteur axios : renouvellement automatique transparent sur erreur 401.

### 5.2 Module Catalogue

Page d'accueil : héro, tendances, derniers ajouts, catégories. **Chaque contenu est affiché avec sa vignette obligatoire** dans les cartes du catalogue. Les cartes affichent aussi : titre, badge de niveau d'accès (aucun badge = gratuit, badge or "★ Premium" = premium, badge teal avec prix = payant). Recherche textuelle sur titres et artistes. Filtres par catégorie, type (vidéo/audio), niveau d'accès.

Lors d'une tentative de lecture protégée, l'API retourne 403 avec `reason`. Le frontend affiche l'écran approprié : invitation à s'abonner (`subscription_required`) ou écran d'achat avec prix (`purchase_required`).

### 5.3 Module Lecture et protection des contenus

**Sur web — streaming HLS sécurisé :**

Les vidéos sont servies en HLS (segments `.ts` de 10 secondes), jamais sous forme de fichier `.mp4` complet. Avant chaque lecture, le backend génère un token signé temporaire (10 min) contenant un fingerprint de session calculé comme le hachage du User-Agent, de l'IP et du cookie httpOnly `sessionId`. Ce token est vérifié à chaque requête de segment `.ts` par le middleware `hlsTokenizer`. Tout changement de navigateur, copie d'URL ou ouverture dans un nouvel onglet invalide le fingerprint et provoque un rejet 403. hls.js (intégré dans react-player) assure la lecture des segments.

Les contenus audio sont servis normalement (fichiers `.mp3` ou `.aac`) — ils sont protégés par authentification JWT mais ne nécessitent pas HLS. En mode hors-ligne, le Service Worker met en cache les fichiers audio (stratégie Cache First, expiration 48h).

**Sur mobile — lecture native et téléchargement chiffré AES-256-GCM :**

La lecture en ligne se fait via expo-av (vidéo en mode paysage automatique via expo-screen-orientation, audio avec mini-player persistant). Pour le téléchargement hors-ligne, le backend génère une clé AES-256 et un IV uniques ainsi qu'une URL signée temporaire (15 min). Le frontend télécharge par chunks de 4–8 Mo via expo-file-system (reprise sur coupure réseau), chiffre immédiatement chaque chunk avec react-native-quick-crypto (AES-256-GCM), et sauvegarde le fichier `.enc` dans le sandbox privé. La clé et l'IV sont stockés dans expo-secure-store. La lecture hors-ligne déchiffre en mémoire vive uniquement — aucun fichier en clair n'est écrit sur le disque.

La progression (position en secondes) est enregistrée toutes les 10 s via POST /api/history/:contentId. À 90 % de la durée, le contenu est marqué terminé.

### 5.4 Module Tutoriels

Tutoriels organisés en séries de leçons ordonnées. Chaque leçon est un fichier média indépendant. Exemples : "Apprendre le salegy — 8 leçons vidéo" (premium), "Cuisiner le romazava — 5 leçons" (gratuit), "Initiation à la programmation en malgache — 15 leçons" (payant, 10 000 Ar).

Suivi de progression : dernière leçon consultée (index), leçons terminées (tableau d'indices), pourcentage de complétion. Section "Mes tutoriels en cours" dans le profil. Bouton "Continuer" ramène à la dernière leçon non terminée.

### 5.5 Module Abonnement Premium

Sélection du plan → POST /api/payment/subscribe → PaymentIntent Stripe → client_secret → formulaire carte (Stripe Elements web / CardField mobile) → webhook Stripe → isPremium: true, role: "premium", premiumExpiry.

### 5.6 Module Achat Unitaire

Bouton "Acheter — [prix] Ar" → POST /api/payment/purchase avec contentId → backend vérifie absence de doublon (collection purchases) → PaymentIntent avec `metadata: { type: "purchase", userId, contentId }` → même flux carte que l'abonnement → webhook distingue par `metadata.type` → document créé dans purchases → accès permanent débloqué.

### 5.7 Module Hors-ligne

**Web (PWA) :** Service Worker Cache First pour les audios (expiration 48h). Les vidéos ne sont pas téléchargeables sur web — elles sont protégées par HLS + tokens signés.

**Mobile :** Téléchargement AES-256-GCM pour les vidéos et les audios. Fichiers `.enc` dans le sandbox privé. Clé dans expo-secure-store. Lecture par déchiffrement en mémoire vive.

### 5.8 Module Fournisseur de contenu

Formulaire d'upload : titre, description, type, catégorie, langue, métadonnées audio/vidéo, **vignette obligatoire** (JPEG ou PNG, ≤ 5 Mo, aperçu avant soumission), niveau d'accès, prix si payant. Pour les tutoriels : gestionnaire de séries de leçons (ajout, réordonnancement, suppression). Multer extrait les métadonnées ID3 automatiquement via music-metadata. Contenu créé avec isPublished: false.

### 5.9 Module Administration

Validation des soumissions (y compris contrôle qualité des vignettes), modification des niveaux d'accès et prix, statistiques d'utilisation et de revenus simulés (7 et 30 jours), gestion des comptes.

---

## 6. Architecture technique

### 6.1 Pattern multi-client avec backend partagé

```
[App Mobile — React Native/Expo]     [App Web — React.js/Vite]
    + AES-256-GCM (hors-ligne)           + HLS + tokens signés
    + expo-file-system (chunks)          + hls.js + react-player
    + react-native-quick-crypto          + Service Worker PWA (audio)
              \                                    /
               ————————[ HTTPS / REST JSON + JWT ]————————
                                    |
                      [API REST — Node.js/Express]
                      + checkAccess + hlsTokenizer
                      + ffmpeg (HLS) + AES keygen
                      + Multer (thumbnail OBLIGATOIRE)
                             /          \
                       [MongoDB]    [/uploads : thumbnails + HLS + audio]
                                          |
                                [Stripe API — mode test]
```

### 6.2 Stack technologique

**Application mobile — Membre 1**

| Composant | Technologie | Version |
|---|---|---|
| Framework | React Native + Expo SDK | 52 |
| Navigation | expo-router | v3.x |
| Lecture média | expo-av | v14.x |
| Chiffrement hors-ligne | react-native-quick-crypto | latest |
| Stockage local | expo-file-system | latest |
| Stockage sécurisé | expo-secure-store | latest |
| Paiement | @stripe/stripe-react-native | latest |
| État global | zustand | v4.x |
| Requêtes API | TanStack Query | v5.x |
| Client HTTP | axios | latest |
| Styling | NativeWind | v4.x |

**Application web — Membre 2**

| Composant | Technologie | Version |
|---|---|---|
| Bibliothèque UI | React.js | 18.x |
| Build tool | Vite | 5.x |
| Navigation | react-router-dom | v6.x |
| Lecteur HLS | hls.js (via react-player) | latest |
| Hors-ligne audio | Service Worker (Workbox) | latest |
| Paiement | @stripe/react-stripe-js | latest |
| État global | zustand | v4.x |
| Requêtes API | TanStack Query | v5.x |
| Styling | Tailwind CSS | v3.x |

**Backend — Membre 3**

| Composant | Technologie | Version |
|---|---|---|
| Environnement | Node.js LTS | 20.x |
| Framework | Express.js | v4.x |
| ODM | Mongoose | v8.x |
| Auth | jsonwebtoken + bcryptjs | v9.x / v2.x |
| Upload | Multer (thumbnail obligatoire) | v1.x |
| Métadonnées audio | music-metadata | v10.x |
| Transcoding HLS | fluent-ffmpeg | latest |
| Crypto (tokens + AES) | Node.js crypto (natif) | built-in |
| Paiement | stripe SDK | v14.x |
| Sécurité | helmet + cors + express-rate-limit | latest |
| Validation | express-validator | latest |

### 6.3 Nouveaux endpoints liés à la protection et aux téléchargements

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | /api/hls/:id/token | JWT + checkAccess | Génération token HLS signé + URL manifest |
| GET | /hls/:id/index.m3u8 | Token HLS | Manifest HLS signé |
| GET | /hls/:id/:segment.ts | Token HLS + fingerprint | Segment vidéo (vérifié à chaque requête) |
| POST | /api/download/:id | JWT + checkAccess | Génération clé AES-256 + IV + URL signée |

---

## 7. Base de données

### 7.1 Choix de MongoDB

MongoDB (v7.x) est retenu pour la flexibilité du modèle document face aux métadonnées hétérogènes des contenus audiovisuels (attributs différents pour films, audios, tutoriels).

### 7.2 Schéma de la collection contents (résumé)

```
_id          : ObjectId
title        : String, obligatoire
description  : String, obligatoire
type         : String, enum "video" | "audio"
category     : String
language     : String, enum "mg" | "fr" | "bilingual"

thumbnail    : String, OBLIGATOIRE
               Chemin /uploads/thumbnails/<uuid>.jpg
               Affiché dans tout le catalogue, la page de détail,
               les miniatures, les résultats de recherche.
               Rejet backend (400) si absent à l'upload.

filePath     : String, chemin source privé (non exposé)
hlsPath      : String, dossier HLS "/uploads/hls/<id>/" (vidéos uniquement)
fileSize     : Number, en octets
mimeType     : String
duration     : Number, en secondes (absent si isTutorial)
viewCount    : Number, défaut 0
isPublished  : Boolean, défaut false
uploadedBy   : ObjectId → users

accessType   : String, enum "free" | "premium" | "paid", défaut "free"
price        : Number, centimes Stripe, null si non payant

artist, album, coverArt, trackNumber (audio uniquement)
resolution, director, cast, subtitles (vidéo uniquement)

isTutorial   : Boolean, défaut false
lessons      : [{ order, title, description, thumbnail?,
                  filePath, hlsPath, duration }]
               La vignette de leçon est optionnelle ;
               si absente, le frontend affiche la vignette du tutoriel.

createdAt, updatedAt : Date
```

Les huit collections complètes sont décrites dans le document 08 (Conception de la base de données).

---

## 8. Sécurité

### 8.1 Authentification JWT + rotation des refresh tokens

JWT 15 min HS256 en mémoire vive. Refresh token 7 jours avec rotation systématique (invalidation de l'ancien en base à chaque renouvellement). Stockage : cookie httpOnly (web) ou expo-secure-store (mobile).

### 8.2 Middleware checkAccess

Vérifie les droits d'accès sur toutes les routes de streaming et de téléchargement. Règles : free → tous, premium → JWT rôle "premium" ou "admin", paid → document dans la collection purchases ou rôle "admin". Retourne 403 avec `reason` (subscription_required, purchase_required, login_required) pour permettre au frontend d'afficher le bon écran.

### 8.3 Protection HLS — middleware hlsTokenizer

Génère un token signé contenant videoId, userId, fingerprint (sha256 du User-Agent + IP + cookie sessionId) et une expiration de 10 minutes. Vérifie ce token à chaque requête de segment `.ts`. Rejet 403 si token expiré, fingerprint non correspondant, ou token réutilisé dans un contexte différent.

### 8.4 Chiffrement AES-256-GCM (mobile)

Clé et IV générés par le backend (Node.js crypto) pour chaque téléchargement. Jamais stockés en base de données. Transmis en HTTPS une seule fois. Le frontend chiffre le fichier localement avec react-native-quick-crypto et stocke la clé dans expo-secure-store.

### 8.5 Hachage des mots de passe

bcrypt, facteur de coût 12 (4 096 itérations). Jamais stockés en clair.

### 8.6 Sécurité Multer — validation des uploads

Types MIME autorisés : image/jpeg, image/png (thumbnail) ; video/mp4, video/quicktime (vidéo) ; audio/mpeg, audio/aac, audio/wav (audio). Tailles maximales : thumbnail 5 Mo, vidéo 500 Mo, audio 50 Mo. Noms de fichiers générés par UUID (jamais le nom d'origine).

### 8.7 Headers HTTP et rate limiting

Helmet : HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP. Rate limiting : 10 req/15min sur les routes d'authentification, 200 req/15min sur les autres.

### 8.8 Validation CORS

Origines autorisées : domaine Vercel (production) et localhost (développement). `credentials: true` pour les cookies httpOnly.

---

## 9. Design et interfaces

### 9.1 Direction artistique

Raffinement sombre et chaleureux, dark mode par défaut (économie de batterie OLED), identité culturelle malgache. Tokens partagés entre mobile et web.

### 9.2 Palette de couleurs

| Rôle | Hexadécimal | Usage |
|---|---|---|
| Bleu cobalt principal | #3584e4 | Boutons primaires, liens |
| Or accent | #e8c547 | Badge Premium, étoiles |
| Teal accent | #2ec27e | Badge payant, bouton achat |
| Fond base | #0d1018 | Fond application |
| Fond surface | #171b26 | Cartes, modales |
| Texte principal | #eef0f6 | Titres |
| Texte secondaire | #8d96a8 | Métadonnées |

### 9.3 Vignettes dans l'interface

Les vignettes (obligatoires) sont affichées dans : les cartes du catalogue (ratio 5:7), les résultats de recherche, la page de détail du contenu, le mini-player (pochette audio), la section "Continuer à regarder", les listes "Mes achats" et "Mes tutoriels en cours", et les tableaux de bord administrateur. Une image de substitution (placeholder) est affichée uniquement pendant le chargement.

### 9.4 Composants principaux

**ContentCard :** vignette ratio 5:7, badge niveau d'accès, titre Sora, métadonnées DM Sans.
**Écrans intermédiaires :** bienveillants (non punitifs), deux variantes (abonnement / achat) avec prix affiché.
**Mini-player audio :** pochette (coverArt ou thumbnail), titre, artiste, contrôles.
**Indicateur de protection :** petite icône HLS visible sur les cartes de vidéos protégées.

---

## 10. Contraintes et exigences non fonctionnelles

**Performance.** Réponse API liste/détail < 500 ms. Middleware `checkAccess` < 100 ms. Premier segment HLS délivré < 2 s après clic "Lire".

**Vignette obligatoire.** Tout contenu publié sans vignette est rejeté par le backend (400) et bloqué côté frontend avant soumission. L'admin peut rejeter une vignette non conforme.

**Protection HLS.** Tout fichier vidéo est servi exclusivement via HLS. Aucune route directe vers un fichier `.mp4` complet n'est exposée publiquement.

**Idempotence des achats.** Double-clic ou retour arrière → 409 sans double débit Stripe.

**Compatibilité.** Mobile : iOS 14+, Android 10+. Web : Chrome, Firefox, Safari, Edge (versions récentes), responsive dès 360 px.

**Chiffrement mobile.** Les fichiers hors-ligne sont toujours chiffrés AES-256-GCM. La lecture en clair en mémoire ne dépasse jamais la durée d'un segment.

---

## 11. Répartition des rôles

| Membre | Domaine | Charge | Responsabilités clés |
|---|---|---|---|
| Membre 1 | Frontend Mobile | 38 % | App React Native/Expo complète, affichage vignettes, AES-256-GCM hors-ligne, Stripe mobile, tutoriels |
| Membre 2 | Frontend Web | 32 % | App React.js/Vite complète, affichage vignettes, lecteur HLS hls.js, tokens HLS, Stripe Elements, tutoriels |
| Membre 3 | Backend + Coordination | 30 % | API REST, ffmpeg → HLS, middleware hlsTokenizer, génération AES-256, Multer (thumbnail obligatoire), MongoDB 8 collections, Stripe, coordination |

---

## 12. Planning prévisionnel — 10 semaines

| Semaine | Membre 1 — Mobile | Membre 2 — Web | Membre 3 — Backend |
|---|---|---|---|
| S1 | Init Expo, maquettes Figma (vignettes partout) | Init Vite, maquettes Figma (vignettes partout) | Contrat d'API, schémas MongoDB (thumbnail required), init Express |
| S2 | ContentCard avec vignette, navigation | ContentCard avec vignette, navigation SPA | Auth JWT, Multer (thumbnail obligatoire + vidéo/audio) |
| S3 | Écrans auth, zustand authStore | Pages auth, zustand authStore | Routes /contents, pipeline ffmpeg → segments HLS |
| S4 | Catalogue + badges niveaux, recherche, filtres | Catalogue + badges niveaux, recherche, filtres | Middleware hlsTokenizer + fingerprint, checkAccess |
| S5 | expo-av (vidéo + audio), mini-player, intégration tokens HLS | hls.js + react-player, mini-player App.tsx, tokens HLS | Routes /history, /tutorial/progress, staging Railway |
| S6 | Téléchargement AES-256-GCM (react-native-quick-crypto + expo-file-system) | Service Worker PWA (audio Cache First 48h) | Endpoint /download (clé AES-256 + IV + URL signée) |
| S7 | Lecture hors-ligne déchiffrement mémoire, expo-secure-store | Stripe Elements, écrans intermédiaires premium/payant | Stripe subscribe + purchase, webhook metadata.type |
| S8 | Stripe CardField, écrans intermédiaires, tutoriels | Upload fournisseur (vignette obligatoire), tutoriels, admin | Routes admin + provider (validation thumbnail), statistiques |
| S9 | Tests mobile (vignettes, HLS, AES, Stripe), corrections | Tests web (vignettes, HLS, PWA, Stripe, 360px), corrections | Tests sécurité (tokens HLS, fingerprint, AES, webhook), Postman |
| S10 | Démonstration mobile | Démonstration web | Mémoire, slides soutenance, production final |

---

## 13. Livrables attendus

**Code source.** Trois dépôts GitHub distincts avec README d'installation.

**Applications déployées.** Backend Railway + Nginx SSL. Frontend web Vercel. Mobile via Expo Go QR code.

**Documentation API.** Collection Postman exportée incluant les routes HLS, download, purchase, avec exemples de requêtes et tests automatisés.

**Maquettes.** Figma haute fidélité (mobile + web) : catalogue avec vignettes, lecteur vidéo HLS, écran de téléchargement, progression tutoriels, écrans intermédiaires, espace fournisseur (formulaire avec upload vignette), tableau de bord admin.

**Document de sécurité.** Description des mécanismes HLS + tokens signés et AES-256-GCM, avec présentation des limites connues (screen recording) pour la soutenance.

**Documentation technique.** Ce cahier des charges, le document d'architecture, la conception BDD, les scénarios d'utilisation, le plan de tests, le design system.

---

## 14. Références bibliographiques

Anderson, C. (2009). *Free: The Future of a Radical Price*. Hyperion. ISBN 978-1401322908.

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216

Apple Inc. (2025). *Human Interface Guidelines — iOS and iPadOS*. https://developer.apple.com/design/human-interface-guidelines

Chodorow, K. (2019). *MongoDB: The Definitive Guide* (3e éd.). O'Reilly Media. ISBN 978-1491954461.

DataReportal. (2025). *Digital 2025 : Madagascar*. Kepios Analysis. https://datareportal.com/reports/digital-2025-madagascar

Expo. (2025). *Expo Documentation — SDK 52*. https://docs.expo.dev

Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* (Thèse de doctorat). University of California, Irvine.

Kumar, V. (2014). Making "Freemium" Work. *Harvard Business Review*, 92(5), 27–29.

Martin, R. C. (2017). *Clean Architecture*. Prentice Hall. ISBN 978-0134494166.

Mongoose. (2025). *Mongoose v8.x Documentation*. https://mongoosejs.com/docs

Newman, S. (2021). *Building Microservices* (2e éd.). O'Reilly Media. ISBN 978-1492034025.

OWASP Foundation. (2023). *OWASP Top Ten 2023*. https://owasp.org/www-project-top-ten/

Pressman, R. S., & Maxim, B. R. (2019). *Software Engineering: A Practitioner's Approach* (9e éd.). McGraw-Hill Education. ISBN 978-1259872976.

Stripe Inc. (2026). *Stripe API Reference — PaymentIntents*. https://stripe.com/docs/api/payment_intents

Stripe Inc. (2026). *Testing Stripe integrations*. https://stripe.com/docs/testing

Tailwind CSS. (2025). *Tailwind CSS v3 Documentation*. https://tailwindcss.com/docs

UNESCO. (2023). *Culture numérique et diversité culturelle dans les pays en développement*. UNESCO Publishing.

Vite. (2025). *Vite — Documentation officielle*. https://vitejs.dev/guide

W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21
