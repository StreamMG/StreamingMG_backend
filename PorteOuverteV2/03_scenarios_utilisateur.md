# Scénarios Utilisateur — StreamMG

**Document :** Scénarios d'utilisation  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026

---

## 1. Introduction

Ce document décrit les scénarios d'utilisation principaux. Chaque scénario précise l'acteur, la plateforme, les préconditions, le déroulement nominal et les cas alternatifs.

**Rappel des niveaux d'accès :** gratuit = tous ; premium = abonnés uniquement ; payant = achat unitaire requis, indépendant de l'abonnement ; tutoriel = mêmes règles + suivi de progression.

**Rappel protection :** les vidéos web sont servies en HLS avec tokens signés (jamais de `.mp4` direct). Les téléchargements mobiles sont chiffrés AES-256-GCM.

---

## 2. Acteurs

**Visiteur** — accès sans compte, contenus gratuits uniquement.  
**Utilisateur standard** — compte gratuit, contenus gratuits + achats unitaires.  
**Utilisateur premium** — abonnement actif, contenus gratuits + premium + achats unitaires.  
**Fournisseur** — upload avec vignette obligatoire, définit accès et prix.  
**Administrateur** — validation, gestion catalogue, statistiques.

---

## 3. Scénarios

### U-01 — Inscription

**Acteur :** Visiteur — **Plateforme :** Mobile et Web

Formulaire d'inscription : nom d'utilisateur, email, mot de passe ≥ 8 caractères. Validation côté client en temps réel. Soumission → backend : bcrypt coût 12, rôle "user", isPremium false, retourne JWT + refresh token. Utilisateur connecté et redirigé.

**Cas alternatifs :** Email déjà utilisé → 409. Mot de passe trop faible → validation client bloque avant soumission.

---

### U-02 — Navigation dans le catalogue et découverte des niveaux d'accès

**Acteur :** Utilisateur standard — **Plateforme :** Mobile et Web

L'utilisateur parcourt le catalogue. **Chaque contenu affiche obligatoirement sa vignette.** Il identifie : sans badge (gratuit), badge or "★ Premium" (premium), badge teal "8 000 Ar" (payant). Clic sur gratuit → lecture immédiate. Clic sur premium → écran intermédiaire "Abonnez-vous à Premium" (boutons "S'abonner" et "Fermer"). Clic sur payant → écran "Acheter — 8 000 Ar" (boutons "Acheter" et "Fermer").

**Cas alternatifs :** Visiteur non inscrit sur contenu premium → invitation à créer un compte. Utilisateur premium sur contenu payant → écran d'achat (l'abonnement ne couvre pas les contenus payants).

---

### U-03 — Lecture d'une vidéo (streaming HLS protégé — web)

**Acteur :** Utilisateur ayant l'accès — **Plateforme :** Web

L'utilisateur clique "Lire" sur une vidéo. Le frontend envoie GET /api/hls/:contentId/token (avec JWT). Le backend vérifie les droits (`checkAccess`), génère un token HLS signé (10 min) contenant le fingerprint de session, et retourne l'URL du manifest signé. hls.js charge le manifest `index.m3u8` et commence à requêter les segments `.ts`. À chaque segment, le middleware `hlsTokenizer` vérifie le token et le fingerprint. Si les deux sont valides, le segment est servi et la lecture continue. À 90 % de la durée, le contenu est marqué terminé dans watchHistory.

**Cas alternatifs :** L'utilisateur copie l'URL du segment dans un autre onglet → fingerprint différent → 403 → IDM ou JDownloader s'arrête après 1 à 3 segments. Token expiré (après 10 min) → frontend redemande un nouveau token automatiquement.

---

### U-04 — Téléchargement hors-ligne d'une vidéo (AES-256-GCM — mobile)

**Acteur :** Utilisateur ayant l'accès — **Plateforme :** Mobile

L'utilisateur clique l'icône "Télécharger" sur une vidéo. Le frontend envoie POST /api/download/:contentId (JWT + checkAccess). Le backend génère une clé AES-256 (32 octets), un IV (16 octets) et une URL signée temporaire (15 min) vers le fichier source. Le frontend télécharge par chunks de 4–8 Mo via expo-file-system (la progression est affichée, l'opération reprend automatiquement si le réseau est coupé). Chaque chunk est immédiatement chiffré avec react-native-quick-crypto (AES-256-GCM). Le fichier final `.enc` est sauvegardé dans `FileSystem.documentDirectory/offline/<contentId>.enc`. La clé AES et l'IV sont stockés dans expo-secure-store.

**Résultat :** l'icône "Télécharger" devient "Téléchargé ✓". Le fichier est accessible hors réseau.

**Cas alternatifs :** Connexion coupée en cours de téléchargement → reprise automatique depuis le dernier chunk. Espace disque insuffisant → message d'erreur "Espace insuffisant". Droits perdus après achat annulé → le fichier local reste accessible (l'accès est permanent).

---

### U-05 — Lecture hors-ligne (déchiffrement en mémoire — mobile)

**Acteur :** Utilisateur avec fichier téléchargé — **Plateforme :** Mobile (mode avion)

L'utilisateur passe en mode avion. Il ouvre l'application, navigue dans "Téléchargements". Le contenu s'affiche avec sa vignette (sauvegardée localement). Il clique "Lire". Le frontend récupère la clé AES depuis expo-secure-store, charge le fichier `.enc` par chunks, déchiffre chaque chunk en mémoire vive avec react-native-quick-crypto, et envoie le flux déchiffré à expo-av. **Aucun fichier en clair n'est jamais écrit sur le disque.** La lecture se déroule normalement.

**Cas alternatifs :** Fichier `.enc` corrompu → message d'erreur, suggestion de re-télécharger. Clé supprimée de SecureStore → message d'erreur, téléchargement requis à nouveau.

---

### U-06 — Souscription à l'abonnement Premium

**Acteur :** Utilisateur standard — **Plateforme :** Mobile et Web

Sélection plan (mensuel 5 000 Ar / annuel 50 000 Ar fictif) → POST /api/payment/subscribe → PaymentIntent Stripe → client_secret → formulaire carte (Stripe Elements web / CardField mobile) → carte 4242 4242 4242 4242 → webhook Stripe → isPremium: true, role: "premium", premiumExpiry J+30. Confirmation affichée.

**Cas alternatifs :** Carte 4000 0000 0000 9995 → refus Stripe → message d'erreur → aucune modification en base.

---

### U-07 — Achat unitaire d'un contenu payant

**Acteur :** Utilisateur standard ou premium — **Plateforme :** Mobile et Web

Clic "Acheter — 8 000 Ar" → POST /api/payment/purchase { contentId } → backend vérifie absence de doublon dans `purchases` → PaymentIntent avec `metadata: { type: "purchase", userId, contentId }` → même flux carte → webhook `payment_intent.succeeded` avec `metadata.type === "purchase"` → document créé dans `purchases` → accès permanent débloqué → bouton "Lire" actif.

**Cas alternatifs :** Doublon → 409 "Vous avez déjà acheté ce contenu". Paiement échoué → aucun document dans `purchases`.

---

### U-08 — Accès refusé : écrans intermédiaires selon le profil

**Acteur :** Utilisateur standard ou premium — **Plateforme :** Mobile et Web

**Cas A — Standard face à du premium :** `checkAccess` → 403 `reason: "subscription_required"` → écran "Abonnez-vous à Premium".

**Cas B — Standard face à du payant :** 403 `reason: "purchase_required"` avec le prix → écran d'achat.

**Cas C — Premium face à du payant :** même comportement que Cas B. L'abonnement Premium ne couvre jamais les contenus payants. Ce cas est fondamental à démontrer en soutenance.

---

### U-09 — Lecture d'un tutoriel avec suivi de progression

**Acteur :** Utilisateur ayant l'accès — **Plateforme :** Mobile et Web

Ouverture du tutoriel "Cuisine malgache — 6 leçons" (gratuit). **La vignette du tutoriel est affichée en en-tête.** Liste des 6 leçons avec titres et durées. Indicateur "0 % complété". Clic leçon 1 → lecture (HLS sur web, expo-av sur mobile). Progression envoyée toutes les 10 s. À 90 % → POST /api/tutorial/progress/:tutorialId `{ lessonIndex: 0, completed: true }` → `completedLessons: [0], percentComplete: 17`. Bouton "Leçon suivante" affiché.

**Post-condition :** profil affiche le tutoriel dans "Mes tutoriels en cours" avec 17 % et sa vignette.

---

### U-10 — Upload d'un contenu par un fournisseur (avec vignette obligatoire)

**Acteur :** Fournisseur — **Plateforme :** Web

Accès à l'espace fournisseur. Clic "Déposer un contenu". Saisie des métadonnées. **Champ "Vignette" : sélection d'une image JPEG ou PNG.** Un aperçu de la vignette s'affiche immédiatement. Si aucune image n'est sélectionnée, le bouton "Soumettre" reste désactivé. Sélection du niveau d'accès "Payant" → champ prix apparaît. Upload du fichier vidéo. Soumission → Multer vérifie la présence du fichier image (`req.files.thumbnail`) → création du document avec `isPublished: false`. Message "Votre contenu a été soumis. Il sera visible après validation."

**Cas alternatifs :** Vignette absente → 400 "La vignette est obligatoire" (validation Multer backend). Image > 5 Mo → 400 "Fichier image trop volumineux". MIME non autorisé → 400 "Format d'image non accepté (JPEG ou PNG uniquement)".

---

### U-11 — Validation d'un contenu par l'administrateur (contrôle vignette)

**Acteur :** Administrateur — **Plateforme :** Web

Section "En attente de validation" → film soumis avec sa vignette visible en aperçu. L'admin vérifie la qualité de la vignette (netteté, représentativité du contenu, absence de texte illisible). Si la vignette est non conforme, l'admin rejette avec commentaire "Vignette insuffisante — merci de fournir une image nette et représentative". Si conforme, clic "Approuver et publier" → `isPublished: true` → visible dans le catalogue avec sa vignette.

---

## 4. Références bibliographiques

Cockburn, A. (2000). *Writing Effective Use Cases*. Addison-Wesley Professional. ISBN 978-0201702255.

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216

Stripe Inc. (2026). *Testing Stripe integrations*. https://stripe.com/docs/testing

Expo. (2025). *expo-file-system Documentation*. https://docs.expo.dev/versions/latest/sdk/filesystem

Expo. (2025). *expo-secure-store Documentation*. https://docs.expo.dev/versions/latest/sdk/securestore
