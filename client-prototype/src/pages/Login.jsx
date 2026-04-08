import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Play } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', marginTop: '-40px' }} className="animate-fade-in">
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        background: 'var(--bg-secondary)', 
        padding: '40px', 
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ 
            background: 'var(--accent-color)', 
            width: 60, height: 60, 
            borderRadius: 16, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.5)'
          }}>
            <Play size={32} color="white" fill="white" />
          </div>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.5rem' }}>Bienvenue sur StreamMG</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Connectez-vous pour accéder au prototype
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ex: premium@test.com"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Mot de passe</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', marginTop: '8px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p>Comptes de test (mot de passe: <strong>password123</strong>) :</p>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span onClick={() => setEmail('premium@test.com')} style={{ cursor: 'pointer', color: 'var(--accent-color)' }}>premium@test.com</span>
            <span onClick={() => setEmail('provider_seed@test.com')} style={{ cursor: 'pointer', color: 'var(--accent-color)' }}>provider_seed@test.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
