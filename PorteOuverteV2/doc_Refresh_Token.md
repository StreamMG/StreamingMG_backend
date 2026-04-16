
# Documentation Technique — Refresh Token dans StreamMG

**Document :** Description technique du mécanisme de refresh token
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malgasy, accessible via une application mobile (React Native/Expo) et une application web (React.js/Vite), avec un modèle économique freemium à quatre niveaux d'accès (gratuit, premium, payant, tutoriel), une protection des contenus par HLS/tokens signés (web) et AES-256-GCM (mobile), des paiements simulés via Stripe en mode test, et une interface riche avec vignettes obligatoires pour tous les contenus.
**Date :** Mars 06, 2026
**Responsable :** Membre 3 — Développeur Backend
**Version :** 1.0

---

## 1. Introduction

Dans l'architecture de StreamMG, le refresh token est un composant essentiel du système d'authentification sécurisée. Il complète le JWT (JSON Web Token), qui sert d'access token de courte durée (15 minutes), en permettant un renouvellement automatique sans reconnexion manuelle. Ce mécanisme assure une expérience utilisateur fluide tout en maintenant un haut niveau de sécurité, adapté aux contraintes du contexte malgache (connexions instables et mobile-dominant). Le refresh token est géré côté backend via Node.js/Express et stocké dans MongoDB, avec une intégration frontend via un intercepteur Axios pour gérer les erreurs 401.

Le refresh token suit les best practices OWASP pour la gestion des sessions, en incluant une rotation systématique et un stockage haché, protégeant ainsi les accès aux contenus premium et payants sans compromettre la viabilité du modèle freemium.

---

## 2. Fonctionnalité détaillée

### 2.1 Génération et stockage
- **Génération** : Lors de l'inscription (POST /auth/register) ou connexion (POST /auth/login), un refresh token est généré (chaîne aléatoire sécurisée, ex. : via crypto.randomBytes). Il est haché avec bcrypt (coût 12, préfixe $2b$) et stocké dans la collection MongoDB `refreshTokens` avec les champs suivants (schéma Mongoose) :
  ```javascript
  {
    _id: ObjectId,
    userId: ObjectId,     // Référence à users._id
    tokenHash: String,    // Hachage bcrypt
    expiresAt: Date,      // Date.now() + 7 jours
    createdAt: Date,
    updatedAt: Date
  }
  ```
  - Index : `userId` (unique non requis, mais pour queries rapides) et `expiresAt` (pour cleanup automatique des expirés).

- **Stockage client** :
  - Web : Cookie httpOnly (sécurisé contre XSS, non accessible JS).
  - Mobile : expo-secure-store (chiffré natif, persistant).

### 2.2 Utilisation et rotation
- **Renouvellement** : Sur erreur 401 (JWT expiré), le frontend envoie POST /auth/refresh avec le refresh token. Le backend :
  1. Hache le token soumis et le compare à `tokenHash` en DB.
  2. Si valide et non expiré, supprime l'ancien document.
  3. Génère et insère un nouveau refresh token (rotation).
  4. Retourne un nouveau JWT (15 min) et le nouveau refresh token.
- **Déconnexion** : POST /auth/logout supprime le document correspondant en DB.
- **Expiration** : Automatique après 7 jours ; queries cron ou middleware pour purger les expirés.

### 2.3 Intégration frontend
- Intercepteur Axios (mobile et web) :
  ```javascript
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 401) {
        try {
          const { data } = await axiosInstance.post('/auth/refresh');
          tokenStore.setToken(data.token);  // Mise à jour JWT
          // Mise à jour refresh token (cookie ou secure-store)
          error.config.headers['Authorization'] = `Bearer ${data.token}`;
          return axiosInstance.request(error.config);  // Relance requête
        } catch {
          tokenStore.logout();  // Redirection login
        }
      }
      // Gestion 403 pour accès refusé (checkAccess)
      return Promise.reject(error);
    }
  );
  ```

---

## 3. Utilité dans StreamMG

- **Maintien de sessions persistantes sécurisées** : Permet des lectures longues (ex. : tutoriels avec progression trackée) sans reconnexion, tout en limitant l'exposition du JWT.
- **Adaptation aux plateformes** : Supporte les différences mobile/web (expo-secure-store vs cookie httpOnly).
- **Protection du modèle freemium** : Intégré avec `checkAccess` (403 pour premium/payant), évitant les abus sur contenus protégés (HLS/AES).
- **Gestion des contraintes locales** : Refresh auto sur connexions instables, sans exposer credentials.

---

## 4. Mesures de sécurité implémentées

- **Hachage bcrypt** : Protège contre breaches DB ; comparaison sécurisée sans stockage en clair.
- **Rotation** : Anti-replay attacks ; token volé devient obsolète.
- **Expiration et invalidation** : Contrôle granulaire (ex. : admin peut supprimer via userId).
- **Intégration avec autres sécurités** : Rate limiting (429), Helmet, CORS (2 origines), express-validator.
- **Conformité** : Aligné sur OWASP Top Ten 2023 (sessions sécurisées) et RFC 8216 (HLS).

---

## 5. Avantages et limites

### 5.1 Avantages
- **Sécurité renforcée** : Least privilege (JWT court), rotation anti-abus.
- **UX fluide** : Pas de reconnexion fréquente.
- **Extensibilité** : DB permet limitations (ex. : 1 token par device/type).
- **Coût bas** : Pas de services externes ; scalable avec MongoDB indexes.

### 5.2 Limites
- **Dépendance DB** : Queries additionnelles ; potentiel bottleneck sur haute charge.
- **Pas stateless** : Contrairement à un refresh JWT signed, nécessite DB pour invalidation.
- **Risques clients** : Si cookie/secure-store compromis (rare), session volable (mitigé par rotation).
- **Non absolu** : Ne protège pas contre screen recording (hors périmètre, comme pour HLS).

---

## 6. Tests recommandés

- **TF-AUTH-03** : Connexion valide → Refresh token en DB et client.
- **TF-AUTH-04** : Rotation → Ancien supprimé, nouveau inséré.
- **TF-AUTH-05** : Logout → Suppression DB.
- Ajouter : Tentative refresh avec token expiré/volé → 401/403.

---

## 7. Références bibliographiques

OWASP Foundation. (2023). *OWASP Top Ten 2023*. https://owasp.org/www-project-top-ten/

Martin, R. C. (2017). *Clean Architecture*. Prentice Hall. ISBN 978-0134494166.

MongoDB Inc. (2025). *MongoDB v7.x Manual — Security*. https://www.mongodb.com/docs/manual/security

Expo. (2025). *expo-secure-store Documentation*. https://docs.expo.dev/versions/latest/sdk/securestore

Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* (Thèse de doctorat). University of California, Irvine.

