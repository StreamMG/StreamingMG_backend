import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const setAuthState = (userData, token, refreshToken) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuthState(res.data.user, res.data.token, res.data.refreshToken);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur de connexion';
      console.error('Login error:', errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
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
      // Local cleanup is already done
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
    <AuthContext.Provider value={{ user, login, logout, updateUser, setAuthState, loading }}>
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
