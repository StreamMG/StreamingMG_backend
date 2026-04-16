# Plan de Tests Fonctionnels — StreamMG

**Document :** Plan de tests  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026

---

## 1. Objectifs et périmètre

Ce plan couvre trois niveaux : tests API backend (Postman, Membre 3), tests interface mobile sur appareil physique et émulateur (Membre 1), et tests interface web sur navigateurs (Membre 2). Une attention particulière est portée à : la vignette obligatoire sur tous les contenus, la protection HLS avec tokens signés et fingerprint, le chiffrement AES-256-GCM mobile, le middleware `checkAccess`, et les achats unitaires.

---

## 2. Tests authentification — API (Membre 3)

**TF-AUTH-01 — Inscription valide.**
POST /api/auth/register `{ username, email, password }`. Résultat : 201, passwordHash bcrypt en base (préfixe $2b$), rôle "user", isPremium false.

**TF-AUTH-02 — Inscription email dupliqué.**
POST avec email existant. Résultat : 409 "Email déjà utilisé".

**TF-AUTH-03 — Connexion valide.**
POST /api/auth/login. Résultat : 200, JWT dans le corps, refresh token en cookie httpOnly.

**TF-AUTH-04 — Rotation du refresh token.**
POST /api/auth/refresh. Résultat : nouveau JWT, nouveau refresh token, ancien token supprimé de la collection `refreshTokens`.

**TF-AUTH-05 — Déconnexion.**
POST /api/auth/logout. Résultat : 200, document refresh token supprimé.

---

## 3. Tests vignette obligatoire — API (Membre 3)

**TF-THUMB-01 — Upload sans vignette.**
POST /api/provider/contents multipart sans fichier `thumbnail`. Résultat : 400 "La vignette est obligatoire." Aucun document créé dans `contents`.

**TF-THUMB-02 — Upload avec vignette invalide (PDF).**
POST avec un fichier PDF en champ `thumbnail`. Résultat : 400 "Type MIME non autorisé". Aucun document créé.

**TF-THUMB-03 — Upload avec vignette > 5 Mo.**
POST avec un fichier JPEG de 6 Mo. Résultat : 400. Aucun document créé.

**TF-THUMB-04 — Upload valide avec vignette JPEG.**
POST avec un fichier JPEG de 1 Mo. Résultat : 201, document `contents` créé avec `thumbnail` renseigné (chemin `/uploads/thumbnails/<uuid>.jpg`). Vérifier que le champ `thumbnail` est non null et non vide.

**TF-THUMB-05 — Upload valide avec vignette PNG.**
Même test avec PNG. Résultat : 201, `thumbnail` renseigné.

**TF-THUMB-06 — Présence de la vignette dans la réponse catalogue.**
GET /api/contents. Résultat : chaque objet dans le tableau `contents` possède un champ `thumbnail` non null. Aucun contenu publié ne doit avoir `thumbnail: null` ou `thumbnail: ""`.

---

## 4. Tests middleware checkAccess — API (Membre 3)

**TF-ACC-01 — Gratuit accessible sans JWT.**
GET /api/hls/:id/token sans header Authorization, contenu `accessType: "free"`. Résultat : 200 et token HLS retourné.

**TF-ACC-02 — Premium refusé à utilisateur standard.**
JWT rôle "user", contenu `accessType: "premium"`. Résultat : 403 `{ reason: "subscription_required" }`.

**TF-ACC-03 — Premium accessible à utilisateur premium.**
JWT rôle "premium". Résultat : 200 et token HLS.

**TF-ACC-04 — Payant refusé sans achat (utilisateur standard).**
JWT rôle "user", contenu `accessType: "paid"`, aucun document dans `purchases`. Résultat : 403 `{ reason: "purchase_required", price: 800000 }`.

**TF-ACC-05 — Payant accessible après achat.**
Même requête après insertion d'un document dans `purchases`. Résultat : 200 et token HLS.

**TF-ACC-06 — Payant refusé à un utilisateur PREMIUM sans achat.**
JWT rôle "premium", contenu `accessType: "paid"`, aucun achat. Résultat : 403 `{ reason: "purchase_required" }`. Vérifie que l'abonnement Premium ne couvre pas les contenus payants.

**TF-ACC-07 — Admin accède à tout.**
JWT rôle "admin", contenu `accessType: "paid"` non acheté. Résultat : 200.

---

## 5. Tests protection HLS — API (Membre 3)

**TF-HLS-01 — Token HLS généré correctement.**
GET /api/hls/:contentId/token avec JWT valide + contenu accessible. Résultat : 200 `{ hlsUrl: "/hls/:id/index.m3u8?token=eyJ..." }`. Vérifier que le token contient `contentId`, `userId`, `fingerprint`, `exp`.

**TF-HLS-02 — Segment .ts accessible avec token valide.**
GET /hls/:id/seg001.ts?token=... (User-Agent et IP correspondant au fingerprint). Résultat : 200 et contenu binaire du segment.

**TF-HLS-03 — Segment .ts refusé avec token expiré.**
Attendre > 10 min puis requêter le même segment avec le même token. Résultat : 403.

**TF-HLS-04 — Segment .ts refusé avec fingerprint différent.**
Copier l'URL du segment HLS et l'utiliser depuis un User-Agent différent (simulé avec header modifié dans Postman). Résultat : 403. Ce test simule IDM ou JDownloader.

**TF-HLS-05 — Aucune route directe MP4.**
GET /uploads/private/ny_fitiavana_src.mp4 (chemin brut). Résultat : 404 ou 403. Aucun fichier `.mp4` complet n'est accessible directement par l'URL.

**TF-HLS-06 — Manifest sans token.**
GET /hls/:id/index.m3u8 sans paramètre `token`. Résultat : 403.

---

## 6. Tests chiffrement AES-256-GCM — Mobile (Membre 1)

**TF-AES-01 — Endpoint de téléchargement retourne clé + IV + URL signée.**
POST /api/download/:contentId avec JWT valide. Résultat : 200 `{ aesKeyHex, ivHex, signedUrl }`. Vérifier que `aesKeyHex` fait bien 64 caractères hexadécimaux (32 octets AES-256) et `ivHex` 32 caractères (16 octets).

**TF-AES-02 — Fichier .enc créé dans le sandbox.**
Déclencher un téléchargement mobile. Résultat : fichier `<contentId>.enc` présent dans `FileSystem.documentDirectory/offline/`. Vérifier que la taille est comparable au fichier source (légère augmentation due au padding AES-GCM).

**TF-AES-03 — Fichier .enc illisible hors application.**
Copier le fichier `.enc` sur un PC via le gestionnaire de fichiers. Tenter d'ouvrir avec VLC ou un éditeur vidéo. Résultat : fichier illisible (données binaires chiffrées).

**TF-AES-04 — Clé stockée dans expo-secure-store.**
Vérifier programmatiquement que `SecureStore.getItemAsync('aes_key_<contentId>')` retourne la clé après téléchargement. Vérifier que la clé est absente si le téléchargement échoue.

**TF-AES-05 — Lecture hors-ligne sans réseau.**
Activer le mode avion. Lancer la lecture d'un contenu téléchargé. Résultat : lecture fluide, progression normale. Vérifier dans les logs que `expo-av` charge depuis le chemin local et non depuis une URL réseau.

**TF-AES-06 — Reprise sur coupure réseau pendant téléchargement.**
Couper le réseau à 50 % du téléchargement, le rétablir. Résultat : le téléchargement reprend depuis le dernier chunk sans recommencer depuis le début.

---

## 7. Tests achats unitaires — API (Membre 3)

**TF-PUR-01 — PaymentIntent achat créé.**
POST /api/payment/purchase `{ contentId }`, utilisateur sans achat antérieur. Résultat : 200 `{ clientSecret }`. Vérifier dans Stripe Dashboard que `metadata.type === "purchase"`, `userId`, `contentId` sont présents.

**TF-PUR-02 — Achat réussi et document purchases créé.**
Compléter le PaymentIntent avec 4242 4242 4242 4242. Résultat : webhook → document dans `purchases` → accès débloqué → GET /api/hls/:id/token retourne 200.

**TF-PUR-03 — Idempotence : double achat.**
POST /api/payment/purchase avec le même contentId pour un utilisateur ayant déjà un achat. Résultat : 409 "Vous avez déjà acheté ce contenu". Aucun PaymentIntent Stripe créé. Aucun document inséré.

**TF-PUR-04 — Achat refusé (carte invalide).**
Carte 4000 0000 0000 9995. Résultat : aucun webhook → aucun document dans `purchases` → accès toujours refusé (403).

---

## 8. Tests progression tutoriels — API (Membre 3)

**TF-TUT-01 — Enregistrement progression.**
POST /api/tutorial/progress/:tutorialId `{ lessonIndex: 0, completed: true }`. Résultat : `completedLessons: [0]`, `percentComplete` calculé.

**TF-TUT-02 — Avancement progressif.**
POST avec `{ lessonIndex: 1, completed: true }`. Résultat : `completedLessons: [0, 1]`, percentComplete recalculé.

**TF-TUT-03 — Tutoriel terminé.**
POST avec la dernière leçon (index 2 pour 3 leçons). Résultat : `percentComplete: 100`.

**TF-TUT-04 — Tutoriels en cours.**
GET /api/tutorial/progress. Résultat : tableau avec `percentComplete < 100`, ordonné par `lastUpdatedAt` décroissant, chaque entrée contient `tutorial.thumbnail` (obligatoire).

---

## 9. Tests sécurité — API (Membre 3)

**TF-SEC-01 — Route protégée sans JWT.**
GET /api/provider/contents sans Authorization. Résultat : 401.

**TF-SEC-02 — Route admin avec token utilisateur.**
GET /api/admin/stats avec JWT rôle "user". Résultat : 403.

**TF-SEC-03 — Rate limiting authentification.**
11 POST /api/auth/login en < 15 min depuis la même IP. Résultat : 11ème requête → 429 Too Many Requests.

**TF-SEC-04 — Fournisseur ne peut pas modifier contenu d'un autre.**
PUT /api/provider/contents/:id avec JWT d'un autre fournisseur. Résultat : 403.

**TF-SEC-05 — Webhook Stripe signature invalide.**
POST /api/payment/webhook avec signature incorrecte. Résultat : 400. Aucune modification en base.

**TF-SEC-06 — Clé AES non accessible via l'API.**
GET /api/download/:contentId une deuxième fois pour le même utilisateur et le même contenu. Résultat : 403 "Ce contenu est déjà téléchargé." (la clé ne doit jamais être retransmise une seconde fois — elle est dans expo-secure-store).

---

## 10. Tests interface mobile (Membre 1)

**TF-MOB-01 — Vignettes affichées dans le catalogue.**
Parcourir le catalogue. Résultat : chaque ContentCard affiche la vignette. Aucune carte avec placeholder définitif (uniquement pendant le chargement).

**TF-MOB-02 — Vignette visible dans les téléchargements.**
Section "Téléchargements". Résultat : chaque contenu téléchargé affiche sa vignette (sauvegardée localement lors du téléchargement).

**TF-MOB-03 — Écrans intermédiaires premium et payant.**
Standard sur contenu premium → écran abonnement. Standard ou premium sur contenu payant → écran achat avec prix. Résultat : écrans s'affichent correctement avec le bon prix.

**TF-MOB-04 — Lecteur vidéo en mode paysage.**
Lecture d'une vidéo. Résultat : paysage automatique via expo-screen-orientation. Retour portrait à la fermeture.

**TF-MOB-05 — Mini-player persistant.**
Lecture audio, navigation vers une autre page. Résultat : mini-player toujours visible avec vignette (coverArt ou thumbnail), lecture continue.

**TF-MOB-06 — Téléchargement AES-256-GCM complet.**
Télécharger une vidéo. Résultat : fichier `.enc` créé, clé dans SecureStore, icône "Téléchargé ✓".

**TF-MOB-07 — Lecture hors-ligne en mode avion.**
Mode avion activé. Lire un contenu téléchargé. Résultat : lecture fluide depuis le fichier `.enc` déchiffré en mémoire.

**TF-MOB-08 — Upload fournisseur : vignette obligatoire.**
Formulaire fournisseur sans image → bouton "Soumettre" désactivé. Avec image → aperçu affiché, bouton activé.

**TF-MOB-09 — Session persistante au redémarrage.**
Fermer et rouvrir l'application. Résultat : reconnexion automatique silencieuse.

**TF-MOB-10 — Progression tutoriel.**
Terminer une leçon. Résultat : barre de progression mise à jour, % affiché.

---

## 11. Tests interface web (Membre 2)

**TF-WEB-01 — Vignettes affichées dans le catalogue.**
Même test que TF-MOB-01 sur Chrome, Firefox, Safari.

**TF-WEB-02 — Lecture HLS dans hls.js.**
Lire une vidéo. Résultat : onglet Réseau de DevTools ne montre aucun `.mp4` complet, uniquement des requêtes vers des segments `.ts` et le manifest `.m3u8`.

**TF-WEB-03 — Token HLS invalide si URL copiée.**
Copier l'URL d'un segment `.ts` depuis DevTools. L'ouvrir dans un nouvel onglet ou dans un autre navigateur. Résultat : 403 (fingerprint non correspondant).

**TF-WEB-04 — Écrans intermédiaires.**
Même tests que TF-MOB-03 sur web.

**TF-WEB-05 — Mini-player persistant.**
Lecture audio, navigation via react-router. Résultat : mini-player toujours présent avec vignette, lecture continue.

**TF-WEB-06 — Service Worker audio (Cache First).**
Lire un audio. DevTools → Application → Cache Storage → vérifier fichier présent. Désactiver réseau → relire. Résultat : lecture depuis le cache.

**TF-WEB-07 — Flux d'achat Stripe Web.**
Carte 4242 4242 4242 4242 dans Stripe Elements. Résultat : confirmation, accès débloqué.

**TF-WEB-08 — Upload fournisseur : vignette obligatoire.**
Soumettre sans image → bouton désactivé côté client. Avec image → aperçu affiché.

**TF-WEB-09 — Responsivité 360 px.**
Redimensionner à 360 px. Résultat : interface lisible, vignettes correctement redimensionnées, boutons accessibles.

**TF-WEB-10 — Progression tutoriel.**
Même test que TF-MOB-10 sur web.

---

## 12. Matrice de traçabilité

| Fonctionnalité | Cas de test | Responsable |
|---|---|---|
| Vignette obligatoire upload | TF-THUMB-01 à 05 | M3 |
| Vignette présente dans catalogue | TF-THUMB-06 | M3 |
| Gratuit accessible sans JWT | TF-ACC-01 | M3 |
| Premium refusé sans abonnement | TF-ACC-02 | M3 |
| Premium accessible avec abonnement | TF-ACC-03 | M3 |
| Payant refusé sans achat (standard) | TF-ACC-04 | M3 |
| Payant accessible après achat | TF-ACC-05 | M3 |
| Payant refusé à Premium sans achat | TF-ACC-06 | M3 |
| Admin accède à tout | TF-ACC-07 | M3 |
| Token HLS généré correctement | TF-HLS-01 | M3 |
| Segment .ts valide | TF-HLS-02 | M3 |
| Token HLS expiré | TF-HLS-03 | M3 |
| Fingerprint différent → 403 | TF-HLS-04 | M3 |
| Aucune route MP4 directe | TF-HLS-05 | M3 |
| Manifest sans token → 403 | TF-HLS-06 | M3 |
| Endpoint download clé AES | TF-AES-01 | M3 |
| Fichier .enc créé | TF-AES-02 | M1 |
| Fichier .enc illisible hors app | TF-AES-03 | M1 |
| Clé dans SecureStore | TF-AES-04 | M1 |
| Lecture hors-ligne sans réseau | TF-AES-05 | M1 |
| Reprise sur coupure réseau | TF-AES-06 | M1 |
| PaymentIntent achat | TF-PUR-01 | M3 |
| Achat réussi + document purchases | TF-PUR-02 | M3 |
| Idempotence double achat | TF-PUR-03 | M3 |
| Vignettes mobile catalogue | TF-MOB-01, TF-MOB-02 | M1 |
| Upload fournisseur vignette mobile | TF-MOB-08 | M1 |
| HLS web (pas de .mp4) | TF-WEB-02, TF-WEB-03 | M2 |
| Vignettes web catalogue | TF-WEB-01 | M2 |
| Upload fournisseur vignette web | TF-WEB-08 | M2 |

---

## 13. Références bibliographiques

Myers, G. J., Sandler, C., & Badgett, T. (2011). *The Art of Software Testing* (3e éd.). Wiley. ISBN 978-1118031964.

Postman Inc. (2025). *Postman Documentation*. https://learning.postman.com/docs

OWASP Foundation. (2021). *OWASP Web Security Testing Guide v4.2*. https://owasp.org/www-project-web-security-testing-guide/

Stripe Inc. (2026). *Testing Stripe integrations*. https://stripe.com/docs/testing

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216
