# Corrections des Erreurs 401 (Unauthorized) - Frontend

## 🔴 Problème identifié

Les requêtes sur les routes protégées (`/api/history`, `/api/tutorial/progress`, `/api/provider/contents`) retournaient des erreurs **401 Unauthorized** même après authentification.

### Causes :
1. Le `refreshToken` reçu lors du login n'était **pas stocké** dans localStorage
2. Lors d'un renouvellement JWT (refresh token interceptor), le token expiré était renouvelé côté serveur mais le nouveau `refreshToken` n'était **pas sauvegardé** localement
3. Sur la 2ème requête échouée, le interceptor ne pouvait pas envoyer le `refreshToken` au serveur pour renouveler le JWT

---

## ✅ Corrections appliquées

### 1. **AuthContext.jsx** — Stocker le refreshToken au login
```javascript
const login = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('token', res.data.token);
    // ✨ NEW: Stocker le refreshToken
    if (res.data.refreshToken) {
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || 'Erreur de connexion' };
  }
};
```

### 2. **Register.jsx** — Même logique pour l'inscription
```javascript
const res = await api.post('/auth/register', { username, email, password });
localStorage.setItem('token', res.data.token);
localStorage.setItem('user', JSON.stringify(res.data.user));
// ✨ NEW: Stocker le refreshToken
if (res.data.refreshToken) {
  localStorage.setItem('refreshToken', res.data.refreshToken);
}
```

### 3. **api.js** — Utiliser le refreshToken en cas de 401
```javascript
if (status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;
  try {
    // ✨ NEW: Récupérer le refreshToken du localStorage
    const refreshToken = localStorage.getItem('refreshToken');
    const payload = refreshToken ? { refreshToken } : {};

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      payload,  // ✨ Envoyer dans le body (mobile + web fallback)
      { withCredentials: true }  // Cookies (web)
    );

    const newToken = res.data.token;
    localStorage.setItem('token', newToken);

    // ✨ NEW: Mettre à jour le refreshToken
    if (res.data.refreshToken) {
      localStorage.setItem('refreshToken', res.data.refreshToken);
    }

    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
    return api(originalRequest);
  } catch (refreshErr) {
    // ✨ NEW: Nettoyer aussi le refreshToken
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // ... redirection
  }
}
```

### 4. **AuthContext.jsx** — Logout complet
```javascript
const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error(err);
  } finally {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // ✨ NEW: Nettoyer le refreshToken aussi
    localStorage.removeItem('refreshToken');
  }
};
```

---

## 🔍 Backend — État des routes protégées

Les routes sont **correctement protégées** par `authRequired`:

| Route | Méthode | Protection | Status |
|-------|---------|-----------|--------|
| `/api/history` | GET | `authRequired` | ✅ |
| `/api/tutorial/progress` | GET | `authRequired` | ✅ |
| `/api/provider/contents` | GET | `authRequired` + `requireRole('provider', 'admin')` | ✅ |

---

## 🚀 Flux d'authentification corrigé

```
LOGIN
  ↓
API retourne { token, refreshToken, user }
  ↓
Frontend stocke : localStorage.token + localStorage.refreshToken + localStorage.user
  ↓
Requête protégée → header Authorization: "Bearer <token>"
  ↓
Si 401 (token expiré) :
  ├─ Interceptor détecte le 401
  ├─ Récupère refreshToken du localStorage
  ├─ POST /auth/refresh avec { refreshToken }
  ├─ Serveur valide et retourne nouveau { token, refreshToken }
  ├─ Frontend met à jour localStorage
  └─ Rejette la requête originale avec le nouveau token
```

---

## ✨ Bénéfices

1. **Renouvellement automatique** : Les tokens expirés sont silencieusement renouvelés
2. **Multi-plateforme** : Fonctionne sur Web (cookies) + Mobile (localStorage)
3. **Rotation de tokens** : Chaque refresh génère un nouveau token (sécurité)
4. **Déconnexion propre** : Tous les tokens sont nettoyés

---

## 📋 À tester

- [ ] Login → Vérifier localStorage (token + refreshToken)
- [ ] Requête à `/api/history` après login
- [ ] Attendre 15min (JWT_EXPIRY=15m) → Requête devrait auto-refresh
- [ ] Logout → Vérifier que localStorage est vide
- [ ] Accès à `/api/contents` (publique) → Pas d'erreur 401
- [ ] Provider login → Accès à `/api/provider/contents`

---

## 📖 Documentation
- JWT_EXPIRY: 15 minutes
- REFRESH_TOKEN_EXPIRY: 7 jours (web) ou 30 jours (mobile)
- Token rotation: Systématique à chaque refresh
- Hash du refresh token: bcrypt coût 12 (OWASP)
