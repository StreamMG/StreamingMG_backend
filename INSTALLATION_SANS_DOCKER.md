# 📖 StreamMG Backend - Installation Stricte (SANS DOCKER)

Cette documentation décrit la procédure stricte pour exécuter l'application **nu (bare-metal)** sur un serveur Windows ou Linux, sans utiliser Docker.

---

## 1. Prérequis Systèmes Exigés

Avant de commencer, assurez-vous que les composants suivants sont installés sur votre machine hôte (système brut) :

1. **Node.js (v20 LTS strict)** : [Télécharger Node.js](https://nodejs.org/)
2. **MongoDB (v7 ou v8)** : Doit être en cours d'exécution localement sur `mongodb://127.0.0.1:27017` ou accessible via une URL Atlas.
3. **FFmpeg** : Requis pour la génération de contenu et le traitement HLS. 
   - **Linux** : `sudo apt install ffmpeg`
   - **Windows** : Télécharger sur [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) et l'ajouter au `PATH`.

---

## 2. Configuration Initiale

Le projet nécessite obligatoirement un environnement bien configuré pour s'exécuter. 

### Étape A - Cloner et installer les dépendances
Ouvrez le terminal à la racine du projet et installez les paquets :
```bash
npm install
```

### Étape B - Créer le fichier des variables d'environnement (`.env`)
Copiez le contenu de `.env.example` dans un nouveau fichier `.env` ou créez-le avec les informations suivantes :
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/streammg
JWT_SECRET=UnSecretTresComplexe123!
JWT_EXPIRES_IN=1h
HLS_TOKEN_SECRET=SecretHLSAvecFingerprint
SIGNED_URL_SECRET=SecretURLTemporaire
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CORS_ORIGIN_WEB=http://localhost:5173
```

### Étape C - Injection des données de test (Seeding)
> **⚠️ ATTENTION :** Cette commande va purger les collections `users` et `contents` actuelles de la base de données. Ne lancez cette commande que si vous avez besoin des données d'exemple.

```bash
npm run seed
```
*(Cela va générer via ffmpeg une vidéo et un audio, et ajouter 4 utilisateurs : `admin`, `provider`, `premium`, `user` avec le mot de passe `password123`).*

---

## 3. Démarrage Strict avec Scripts Fournis

Pour faciliter le démarrage continu, des scripts d'exécution dédiés ont été fournis pour **Windows** et **Linux**. 
Ces scripts vont vérifier les modules et lancer Express directement sur le port spécifié (par défaut `3001`).

### 🐧 Pour LINUX / macOS (`start-linux.sh`)
Ouvrez votre terminal et accordez les droits d'exécution, puis lancez le script :
```bash
chmod +x start-linux.sh
./start-linux.sh
```

### 🪟 Pour WINDOWS (`start-windows.bat`)
Double-cliquez simplement sur le fichier **`start-windows.bat`** depuis l'explorateur de fichiers, ou exécutez-le dans un invite de commande (CMD) :
```cmd
start-windows.bat
```

---

## 4. Configuration optionnelle de Nginx (Host-Level)
L'API tournera maintenant sur `http://localhost:3001/api`.

Si vous souhaitez l'exposer sur le port 80 en production (sans utiliser Docker), vous devez installer Nginx sur votre machine hôte (ex: `sudo apt install nginx`), copier le contenu de notre `nginx.conf` dans `/etc/nginx/nginx.conf`, puis redémarrer le service Nginx (`sudo systemctl restart nginx`).
