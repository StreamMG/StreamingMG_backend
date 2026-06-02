import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurer l'utilisateur depuis le localStorage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const userData = res.data.user;
      const token = res.data.token;
      
      // Mise à jour du state
      setUser(userData);
      
      // Stockage sécurisé
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      // Stocker le refreshToken pour le renouvellement
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
      }
      
      // Mettre à jour le header Authorization
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur de connexion';
      console.error('Login error:', errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');

    // Nettoyage local immédiat: l'utilisateur doit être déconnecté même si l'API est indisponible.
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];

    try {
      await api.post('/auth/logout', null, {
        timeout: 4000,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      // Le nettoyage local est déjà fait. L'API peut être indisponible sans bloquer l'utilisateur.
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-base)',
        fontSize: '14px',
        color: 'var(--text-secondary)'
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
