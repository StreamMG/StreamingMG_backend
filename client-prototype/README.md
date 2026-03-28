# 🎬 StreamMG — Prototype React HLS Player

Ce dossier contient une application web légère React / Vite dédiée **exclusivement au test sécurisé du pipeline vidéo HLS** du backend StreamMG.

## 🚀 Démarrage Rapide

1. Assurez-vous que le backend `streamMG-backend` tourne en arrière-plan (`npm run dev` à la racine).
2. Installez les dépendances du frontend :
   ```bash
   cd client-prototype
   npm install
   ```
3. Lancez le serveur de développement (accessible sur le réseau local) :
   ```bash
   npm run dev -- --host
   ```
4. Ouvrez `http://192.168.0.37:5175` ou `http://localhost:5175`.

---

## 🛡️ Architecture & Sécurité Validées

Ce lecteur est volontairement dépouillé pour se concentrer sur **la validation des contraintes de sécurité (Rule-05 et Anti-Pirate)** :

- **Tokenisation Cookie (HLSTokenizer)** : Le lecteur demande l'accès au catalogue via `/api/hls/:id/token`. L'API répond par un *HTTP-Only Cookie* indécodable par un attaquant côté client, ce qui permet à `hls.js` de lire la vidéo en respectant le `Fingerprint` (IP + User-Agent).
- **RÈGLE-05 Appliquée** : Un utilisateur `Premium` dispose du droit absolu sur les vidéos gratuites et premium. S'il tente d'ouvrir une Masterclass `Paid` sans l'avoir achetée, la protection bloque l'accès (`403 purchase_required`) et le lecteur l'en avertit proprement.
- **Anti-Aspirateur (IDM)** : Toute tentative de téléchargement parallèle massif des fragments `.ts` par IDM est bloquée (via le Rate Limiter à 30 req/minute). Le lecteur HLS web, lui, charge posément les blocs toutes les 5 secondes sans jamais accrocher le filtre anti-hack.

## 📁 Fichiers d'Intérêt

- `src/pages/VideoPlayer.jsx` : L'implémentation robuste de `hls.js`, avec injection de `xhr.withCredentials` afin de transférer automatiquement le Cookie HLS émis par le backend.
- `src/api.js` : Client Axios gérant la rafraîchissement transparent du Token d'authentification tous les 15 minutes.
- `.env` : Paramètres réseaux pour brancher dynamiquement le front sur l'IP du serveur sans erreur CORS.
