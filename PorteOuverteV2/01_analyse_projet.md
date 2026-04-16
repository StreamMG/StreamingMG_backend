# Analyse du Projet — StreamMG

**Document :** Analyse et cadrage du projet  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Niveau :** Licence 3 Génie Logiciel  
**Type :** Projet de groupe, obligatoire  
**Équipe :** 3 membres  
**Date :** Février 2026

---

## 1. Contexte et problématique

### 1.1 Patrimoine culturel malgache et absence numérique

Madagascar possède un patrimoine audiovisuel et musical d'une richesse exceptionnelle : le hira gasy (théâtre musical traditionnel des hautes terres), le salegy (musique populaire du nord), le tsapiky (rythmes du sud-ouest), le beko, les documentaires sur la biodiversité unique de l'île, les productions cinématographiques locales et les émissions culturelles radiophoniques. Ce patrimoine reste pourtant absent, ou quasi absent, des grandes plateformes internationales de diffusion numérique. Netflix, Spotify ou YouTube Premium proposent des catalogues massivement orientés vers les productions occidentales. Les rares contenus africains ou malgaches qui y figurent représentent une fraction marginale de l'offre.

### 1.2 Contexte numérique malgache

Selon DataReportal (2025), Madagascar compte environ 18,2 millions de connexions mobiles actives (56,2 % de la population), mais seulement 6,6 millions d'internautes (20,4 %). Le mobile est le premier et souvent le seul terminal numérique accessible. La bande passante est inégale : 4G disponible en zones urbaines mais coûteuse, 3G ou 2G en zones rurales. Ces contraintes structurelles justifient : le mode hors-ligne avec téléchargement chiffré sur mobile, le streaming HLS adaptatif sur web, le dark mode par défaut (économie de batterie sur écrans OLED), et le téléchargement par chunks pour supporter les coupures réseau.

### 1.3 Problématique

Comment concevoir, dans les contraintes d'un projet académique de Licence, une plateforme de diffusion audiovisuelle et éducative qui intègre un modèle économique freemium multi-niveaux, une protection efficace contre les téléchargements non autorisés sans DRM complexe, adaptée aux contraintes locales malgaches, et démontrant la maîtrise d'une architecture logicielle full-stack avec deux clients frontend distincts consommant une API commune ?

---

## 2. Objectifs du projet

### 2.1 Objectif principal

Développer une plateforme cross-platform de diffusion audiovisuelle et éducative malgache, accessible via une application mobile (React Native/Expo) et une application web (React.js/Vite), avec un modèle économique freemium à quatre niveaux d'accès, une protection des contenus par HLS/tokens signés (web) et AES-256-GCM (mobile), des paiements simulés via Stripe en mode test, et une interface riche avec vignettes obligatoires pour tous les contenus.

### 2.2 Objectifs secondaires

La plateforme propose un catalogue audiovisuel organisé où chaque contenu est identifiable visuellement par sa vignette obligatoire. Elle protège les contenus contre les téléchargements non autorisés sur le web (HLS + tokens signés + fingerprint de session) et sécurise les téléchargements hors-ligne sur mobile (chiffrement AES-256-GCM dans le sandbox privé). Elle permet aux fournisseurs de définir le niveau d'accès et le prix de leurs contenus. Elle offre une expérience éducative avec suivi de progression pour les tutoriels. Elle simule des achats unitaires via Stripe. Elle maintient la cohérence d'expérience entre les deux plateformes.

---

## 3. Modèle économique

StreamMG adopte un modèle freemium multi-niveaux à quatre catégories :

Le **contenu gratuit** est accessible à tous sans inscription. Le **contenu premium** est accessible aux abonnés Premium (forfait mensuel ou annuel simulé). Le **contenu payant** requiert un achat unitaire permanent indépendant de l'abonnement. Le **tutoriel** suit l'un des trois niveaux d'accès précédents avec une logique de progression en séries de leçons.

**Règle fondamentale :** l'abonnement Premium ne couvre jamais les contenus de niveau "payant". Ce point est vérifié côté backend par le middleware `checkAccess` indépendamment du rôle JWT de l'utilisateur.

**Vignette obligatoire :** tout contenu publié sur la plateforme doit disposer d'une photo de couverture (vignette). Cette contrainte est technique (champ `thumbnail` obligatoire dans le schéma Mongoose, validation Multer) et éditoriale (rejet administrateur si absente ou non conforme).

---

## 4. Périmètre fonctionnel

### 4.1 Fonctionnalités incluses dans le MVP

Le catalogue couvre : films malgaches, séries télévisées, musique traditionnelle (hira gasy, salegy, tsapiky, beko), musique contemporaine, documentaires, podcasts, tutoriels. Chaque contenu est affiché avec sa vignette, son niveau d'accès et son prix si payant.

La **protection anti-téléchargement web** repose sur HLS (segments `.ts` de 10 secondes), tokens signés temporaires (10 min) et vérification du fingerprint de session à chaque requête de segment. Aucun fichier `.mp4` complet n'est jamais servi directement.

Le **téléchargement hors-ligne sécurisé sur mobile** utilise expo-file-system (chunks de 4–8 Mo, reprise sur coupure réseau) et le chiffrement AES-256-GCM via react-native-quick-crypto. Les fichiers sont stockés sous `.enc` dans le sandbox privé. La clé est dans expo-secure-store.

Les **tutoriels** organisent les leçons en séries avec suivi de progression (dernière leçon, % complété).

Les **achats unitaires** sont simulés via Stripe (PaymentIntent, webhook, collection `purchases` MongoDB, accès permanent).

L'**espace fournisseur** inclut le formulaire d'upload avec vignette obligatoire, le niveau d'accès, le prix, et le gestionnaire de leçons pour les tutoriels.

### 4.2 Fonctionnalités exclues

Restent hors périmètre : paiements en production (clés Stripe live), DRM complet (Widevine, FairPlay), streaming live, recommandation algorithmique, publication sur les stores, certifications de complétion de tutoriels.

---

## 5. Architecture générale

```
[App Mobile — React Native/Expo]     [App Web — React.js/Vite]
        Membre 1                              Membre 2
    + AES-256-GCM (offline)            + HLS + tokens signés
    + expo-file-system                 + hls.js + react-player
    + react-native-quick-crypto        + Service Worker PWA
              \                                  /
               ———————[ HTTPS / REST JSON + JWT ]———————
                                   |
                     [API REST — Node.js/Express]
                           Membre 3
                    + Middleware checkAccess
                    + HLS tokenizer + fingerprint
                    + Clé AES-256 génération
                    + Stripe SDK (subscribe + purchase)
                          /         \
                    [MongoDB]   [/uploads : thumbnails (obligatoire) + HLS segments + audio.enc]
                                        |
                              [Stripe API — mode test]
```

---

## 6. Répartition des rôles

**Membre 1 — Développeur Frontend Mobile (38 %).** Intégralité de l'application React Native/Expo, y compris l'affichage des vignettes dans le catalogue, le téléchargement hors-ligne avec chiffrement AES-256-GCM (react-native-quick-crypto, expo-file-system, expo-secure-store), les écrans intermédiaires d'accès, le flux Stripe mobile, les interfaces de tutoriels.

**Membre 2 — Développeur Frontend Web (32 %).** Intégralité de l'application React.js/Vite, y compris l'affichage des vignettes, le lecteur HLS (hls.js intégré dans react-player), la gestion des tokens HLS signés, les écrans intermédiaires, Stripe Elements, les pages de tutoriels, le Service Worker PWA pour les audios.

**Membre 3 — Développeur Backend + Coordination (30 %).** Intégralité de l'API REST, y compris le pipeline de transcoding HLS (ffmpeg), la génération et vérification des tokens signés avec fingerprint, la génération des clés AES-256 pour les téléchargements mobiles, la validation Multer des vignettes (obligatoire, JPEG/PNG ≤ 5 Mo), les 8 collections MongoDB, Stripe SDK, middleware `checkAccess`, sécurité complète.

---

## 7. Planning prévisionnel — 10 semaines

| Semaine | Membre 1 — Mobile | Membre 2 — Web | Membre 3 — Backend |
|---|---|---|---|
| S1 | Init projet Expo, maquettes Figma mobile (vignettes partout) | Init projet Vite, maquettes Figma web (vignettes partout) | Contrat d'API complet, schémas MongoDB (thumbnail obligatoire), init Express |
| S2 | Composants de base, affichage vignettes ContentCard, navigation | Composants de base, affichage vignettes ContentCard, navigation SPA | Auth JWT + refresh token, Multer (thumbnail obligatoire + vidéo/audio) |
| S3 | Écrans auth, zustand authStore, session persistante | Pages auth, zustand authStore, session cookie httpOnly | Routes /contents, pipeline ffmpeg → HLS, segments .ts |
| S4 | Catalogue avec vignettes + badges niveaux d'accès, recherche | Catalogue avec vignettes + badges niveaux d'accès, recherche | Middleware HLS tokenizer + fingerprint session, checkAccess |
| S5 | Lecteur expo-av (vidéo + audio), mini-player, intégration tokens | Lecteur hls.js + react-player, mini-player App.tsx, tokens HLS | Routes /history, /tutorial/progress, déploiement staging Railway |
| S6 | Téléchargement AES-256-GCM (react-native-quick-crypto + expo-file-system) | Service Worker PWA (Cache First audio), expiration 48h | Génération clé AES-256 + IV + URL signée, endpoint /download |
| S7 | Lecture hors-ligne déchiffrement en mémoire, expo-secure-store | Stripe Elements, écrans intermédiaires (premium/payant/login) | Stripe subscribe + purchase, webhook, collection purchases |
| S8 | Stripe CardField, écrans intermédiaires, interfaces tutoriels | Interface fournisseur (upload vignette obligatoire + leçons), admin web | Routes admin + provider (validation thumbnail), statistiques |
| S9 | Tests mobile (vignettes, HLS, AES, Stripe), corrections | Tests web (vignettes, HLS, PWA, Stripe, responsivité), corrections | Tests sécurité (tokens, fingerprint, CORS, rate-limit, webhook), Postman |
| S10 | Préparation démonstration mobile | Préparation démonstration web | Finalisation mémoire, slides soutenance, déploiement production |

---

## 8. Références bibliographiques

DataReportal. (2025). *Digital 2025 : Madagascar*. Kepios Analysis. https://datareportal.com/reports/digital-2025-madagascar

Anderson, C. (2009). *Free: The Future of a Radical Price*. Hyperion. ISBN 978-1401322908.

Kumar, V. (2014). Making "Freemium" Work. *Harvard Business Review*, 92(5), 27–29.

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216

Chodorow, K. (2019). *MongoDB: The Definitive Guide* (3e éd.). O'Reilly Media. ISBN 978-1491954461.

Expo. (2025). *Expo Documentation — SDK 52*. https://docs.expo.dev

OWASP Foundation. (2023). *OWASP Top Ten 2023*. https://owasp.org/www-project-top-ten/

Newman, S. (2021). *Building Microservices* (2e éd.). O'Reilly Media. ISBN 978-1492034025.

Pressman, R. S., & Maxim, B. R. (2019). *Software Engineering: A Practitioner's Approach* (9e éd.). McGraw-Hill Education. ISBN 978-1259872976.
