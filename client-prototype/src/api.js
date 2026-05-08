import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ── Request : injecter le JWT si disponible ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Routes publiques : un 401 NE doit PAS déclencher de refresh ni de redirection
const PUBLIC_PATTERNS = [
  /^\/contents/,
  /^\/health/,
];

const isPublicUrl = (url = '') => {
  const path = url.replace(import.meta.env.VITE_API_URL || '', '');
  return PUBLIC_PATTERNS.some((p) => p.test(path));
};

// ── Response : gestion auto du token expiré ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 401 sur route publique → ignorer silencieusement
    if (status === 401 && isPublicUrl(originalRequest.url)) {
      // Supprimer le token expiré du localStorage pour éviter les futures erreurs
      localStorage.removeItem('token');
      return Promise.reject(error);
    }

    // 401 sur route protégée → tenter un refresh une seule fois
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh échoué → déconnexion propre
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Rediriger seulement si on n'est pas déjà sur login/register
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
