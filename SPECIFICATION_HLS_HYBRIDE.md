# Spécification Technique : Sécurisation Hybride HLS (Zéro Régression Web)

Ce document est à l'attention du développeur Backend. Il détaille la stratégie et l'implémentation requise pour résoudre un problème de permission de lecture HLS rencontré exclusivement sur l'application mobile (Expo-AV), tout en préservant **à 100% le comportement actuel du lecteur Web**.

## 🔴 Le Problème
L'application Mobile développée sur React Native (Expo) utilise le composant natif de l'OS (`expo-av`). Ce composant télécharge les segments vidéo (`.ts`) automatiquement en lisant le `.m3u8`.
Toutefois, ce composant est "aveugle" : il est impossible de lui forcer à envoyer les cookies HTTP ou des `Headers` (comme le User-Agent ou de forcer un maintien d'IP exacte, d'autant que le mobile bascule souvent entre 4G/Wifi).
Conséquence : Le middleware de sécurité Backend **rejette les requêtes des segments avec une erreur 403**, car le Fingerprint de l'appareil ne correspond plus à cause de la perte de ces informations en cours de route. L'anti-aspiration IDM bloque légitimement le player.

## 🟢 La Solution (Approche Hybride "Voie Rapide Mobile")
Afin de ne pas briser la mécanique Web qui fonctionne très bien, l'idée est de :
1. Continuer d'utiliser le système HLS actuel intact pour les navigateurs.
2. Ajouter des marqueurs furtifs dans le token de sécurité (`platform` et `deviceId`).
3. Lorsque le middleware backend détecte que la lecture provient d'un "mobile", **il désactive la vérification IP/User-Agent**, considérant que seule la signature inaltérable de la clé HMAC constitue la validation de session.
4. Pour permettre au player mobile (`expo-av`) d'envoyer son token systématiquement, **le `.m3u8` est intercepté et réécrit à la volée** pour apposer le token de sécurité (`?token=xyz`) à chaque ligne de `.ts`.

Ainsi, Expo-AV interrogera automatiquement `/hls/123/segment1.ts?token=xyz` sans aucun cookie, et le middleware le laissera passer au vu de sa signature.

---

## 🛠️ Instructions d'Implémentations (Fichiers concernés)

Voici la roadmap détaillée pour appliquer ce correctif hybride :

### 1. `src/utils/crypto.utils.js` (La mécanique du jeton HMAC)
* **Contrainte** : Conserver le code existant qui gère le hachage.
* **Ce qui change** : 
  1. Ajouter deux paramètres facultatifs dans la fonction de génération : `generateHlsToken(contentId, userId, fingerprint, platform = 'web', deviceId = null)`. L'objectif est d'insérer `p: platform` et `did: deviceId` dans le JSON `.payload` que vous signez.
  2. Modifier `verifyHlsToken(token)` : Vous devez impérativement retirer la ligne qui vérifie si `pl.fingerprint === currentFingerprint`. À présent, la fonction de vérification ne doit s'occuper **que de s'assurer que la signature cryptographique est authentique et que la validité n'a pas expirée**. S'il est valide, renvoyez l'objet `payload`. La comparaison du fingerprint sera relayée au middleware.

### 2. `src/controllers/hlsController.js` (La Douane initiale)
* **Contrainte** : Maintenir l'émission du token.
* **Ce qui change** :
  1. Modifier `getHlsToken`.
  2. Lire le `req.headers['x-platform']` (par défaut `'web'`).
  3. Si la plateforme est `mobile`, rechercher et valider la présence de `req.headers['x-device-id']`.
  4. Générer le HMAC à l'aide de votre utilitaire en lui passant ces nouvelles variables pour sceller le token.

### 3. `src/middlewares/hlsTokenizer.middleware.js` (L'Aiguillage Intelligent)
* **Contrainte** : C'est ici que se fait la magie de la "Zéro Régression".
* **Ce qui change** :
  1. Après avoir appelé `verifyHlsToken(token)` et récupéré le payload (qui est cryptographiquement valide).
  2. Faîtes une condition de vérification croisée :
     ```javascript
     if (payload.p === 'web' || !payload.p) {
        // Mode Classique Web : On recalcule l'IP et la session.
        const currentFp = generateFingerprint(req.ip || '', req.cookies?.sessionId || '');
        if (payload.fingerprint !== currentFp) {
           return res.status(403).json({ message: "Fingerprint mismatch. Accès bloqué." });
        }
     } else if (payload.p === 'mobile') {
        // Mode Voie Rapide Mobile : L'absence de fraude est garantie par le signature HMAC (personne ne peut forger ce token sans le DeviceID).
        // On ne vérifie ni l'IP ni le User-Agent, ils sont instables.
     }
     ```

### 4. `src/routes/hlsFiles.routes.js` (La Réécriture Chirurgicale du Manifeste)
* **Contrainte** : `express.static` sert aveuglement la vidéo. Or le lecteur mobile a besoin du token sur les sous-fichiers.
* **Ce qui change** :
  - **Ajouter une route `.get()` avant** la déclaration du `express.static`, ciblant spécifiquement le manifeste : `router.get('/:contentId/index.m3u8', async (req, res, next) ...)`.
  - Dans cette fonction :
    1. Si `req.hlsPayload.p !== 'mobile'`, invoquez `next()` (ainsi le web récupère le fichier brut par express.static, on ne casse rien !).
    2. Si c'est du mobile : invoquez `fs.promises.readFile` pour aspirer le contenu exact de `index.m3u8` sur le serveur local.
    3. Exécutez une substitution regex basique : `const signedManifest = fileContent.replace(/(\.ts)/g, \`.ts?token=\${req.query.token}\`);`
    4. Répondez au client (expo) via un `.send(signedManifest)` assorti d'un header `Content-Type: application/vnd.apple.mpegurl`.

## ✨ Résultat Final
* **Le client web** ne verra **aucune différence** avec la semaine dernière. L'anti-aspiration IDM (bloquant le multithreading IP) fonctionnera de manière robuste grâce aux cookies protégés.
* **Le client mobile** va subitement s'animer. Son composant `expo-av` natif n'a plus qu'à "plug & play", sans s'inquiéter de sa connectivité, car la sécurité HMAC inviolable protège le flux.

---

## 🔄 Endpoints API Modifiés

La documentation de l'API (`api_documentation_streamMG.md`) a été mise à jour. Voici le résumé des changements apportés pour refléter ces nouvelles fonctionnalités :

1. **`GET /hls/:id/token` (Modifié)**
   - **Ajout de Headers** :
     - `X-Platform` *(Optionnel, string)* : Indique la plateforme (`web` ou `mobile`). Par défaut `web`.
     - `X-Device-Id` *(Obligatoire si mobile, string)* : Identifiant unique de l'appareil mobile (ex: `expo-device.osBuildId`).

2. **`GET /hls/:id/index.m3u8?token=<hlsToken>` (Modifié)**
   - **Changement de comportement (Mobile)** : Le serveur intercepte la requête si le token a été généré pour `mobile`, et retourne un manifeste `.m3u8` réécrit dynamiquement à la volée où chaque ligne de fichier `.ts` possède le paramètre `?token=xyz` suffixé.

3. **`GET /hls/:id/:segment?token=<hlsToken>` (Modifié)**
   - **Assouplissement des règles (Mobile)** : Pour les lecteurs mobiles, la vérification drastique du Fingerprint (User-Agent + IP + SessionId) est **désactivée**. Seule la possession d'un token dont la signature cryptographique est authentique est requise pour délivrer le segment vidéo.
