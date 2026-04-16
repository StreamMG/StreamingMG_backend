# 🔀 Rapport de Comparaison des Branches : `featureTsiky` (Actuelle) vs `patch`
**Date :** 16 Avril 2026  
**Analyse des différences Git**

La branche `patch` (écrite par un autre collaborateur) apporte des modifications majeures axées sur la compatibilité Windows, le nettoyage de la documentation et l'adaptation de certaines règles fonctionnelles.

---

## 1. 🗑️ Nettoyage massif de la Documentation
La branche `patch` a supprimé toute l'ancienne documentation technique éclatée et l'a remplacée par des fichiers consolidés.
- **Supprimés (-5184 lignes) :** L'intégralité du dossier `PorteOuverteV2/*.md` qui contenait les spécifications (00 à 11).
- **Ajoutés (+1411 lignes) :**
  - `api_documentation_streamMG.md` : Nouvelle documentation API unifiée générée par le développeur.
  - `SPECIFICATION_HLS_HYBRIDE.md` : Un nouveau document décrivant une architecture hybride.

## 2. 🛠️ Fix de compatibilité Windows (Chemins de fichiers)
Les corrections les plus importantes se situent dans la gestion des fichiers locaux, corrigeant l'erreur classique des slashes de dossiers sous Windows :
- **`src/services/ffmpegService.js` :**
  Au lieu d'utiliser `path.join(__dirname, '../../uploads/...')` qui casse souvent sous Windows en fonction d'où la config est lancée, le développeur a utilisé `path.resolve(process.cwd(), 'uploads', ...)`.
- **`src/routes/hlsFiles.routes.js` :**
  Même réécriture de chemin (`process.cwd()`) pour sécuriser le middleware `express.static` qui sert les fichiers `.m3u8` et `.ts`. Il a aussi commenté le code pour dire Explicitly `FIX WINDOWS`. L'option `fallthrough: true` a été ajoutée à `express.static`.

## 3. ⚠️ Hardcodage / Mock de Sécurité (Gros point d'attention)
Le système de protection contre le vol de vidéos (anti-IDM, etc.) a été **désactivé/bypassed** dans cette branche pour faciliter les tests :
- **`src/utils/crypto.utils.js` :**
  La fonction de génération asymétrique `generateFingerprint` (qui hash l'IP et le navigateur web) a été commentée. Elle a été remplacée par une chaîne retournée en dur : `'TEST-FINGERPRINT-1234567890'`. **Ceci ne doit absolument pas partir en production.**

## 4. 🗂️ Refonte de certaines catégories (Modèle BDD)
- **`src/models/Content.model.js` :**
  Le développeur a simplifié les nomenclatures malgaches de la base de données.
  - *Avant :* `'film', 'salegy', 'hira-gasy', 'tsapiky', 'beko', 'documentaire', 'podcast', 'tutoriel', 'musique-contemporaine', 'autre'`.
  - *Après (Branche patch) :* `'film', 'musique', 'documentaire', 'podcast', 'autre', 'tutoriel', 'tantara'`.
  Tous les genres musicaux malgaches ont été regroupés sous "musique", et le type "tantara" (radio-nouvelles/historique) a été ajouté.

## 5. ⚙️ Outils & Configuration
- **Ajout de scripts (Dossier `scripts/`) :** `generate.js` et `test_upload.js` (un script de test d'upload automatisé d'environ 140 lignes).
- **Update des controllers :** Des ajouts de `+` et `-` de quelques lignes sur `providerController.js` et `historyController.js` pour du logging ou du fix mineur lié au HLS ou variables.

---

### 📝 Bilan et Recommandations
1. **La branche `patch` est très utile pour le support Windows** (les modifications sur `process.cwd()` sont de bonnes pratiques en Node.js pour unifier les chemins entre OS).
2. **Le Mock de sécurité doit être retiré** : Si tu dois fusionner (merge) la branche patch dans ta branche `featureTsiky`, il faut absolument refuser la modification de `src/utils/crypto.utils.js` pour ne pas rendre l'anti-IDM inefficace.
3. **Le nettoyage des documentations** traduit une volonté de centralisation. Si cela convient à l'équipe, le nouveau document API `api_documentation_streamMG.md` est un apport solide, mais attention à la perte des specs métier.
