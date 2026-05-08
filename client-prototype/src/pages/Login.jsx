import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    if (!res.success) setError(res.message);
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px',
      background: 'radial-gradient(ellipse at top left, rgba(53,132,228,0.08) 0%, transparent 50%), var(--bg-base)'
    }}>
      {/* Background art */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(53,132,228,0.07) 0%, transparent 70%)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-200px', left: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,197,71,0.05) 0%, transparent 70%)'
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }} className="animate-fade-in">
        {/* Card */}
        <div style={{
          background: 'rgba(23, 27, 38, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--bg-border)',
          borderRadius: '24px',
          padding: '48px 40px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '12px' }}>
            <img
              src="https://i.ibb.co/BKzdqmBw/streammg-logo-mada-1777321847119-trasparent.png"
              alt="StreamMG Logo"
              style={{ width: '52px', height: '52px', objectFit: 'contain' }}
            />
            <span style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Stream<span style={{ color: 'var(--primary)' }}>MG</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, textAlign: 'center', marginBottom: '6px' }}>
            Bon retour !
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px' }}>
            Connectez-vous pour accéder au patrimoine malagasy
          </p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(237,51,59,0.1)', border: '1px solid rgba(237,51,59,0.25)',
              color: '#ff6b75', padding: '12px 16px', borderRadius: '10px', marginBottom: '24px',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingLeft: '42px', paddingRight: '42px' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center'
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '15px', marginTop: '8px', borderRadius: '12px' }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Comptes test */}
          <div style={{
            marginTop: '28px', padding: '16px', borderRadius: '12px',
            background: 'rgba(53,132,228,0.06)', border: '1px solid rgba(53,132,228,0.15)'
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Comptes de test (mot de passe: password123)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { email: 'premium@test.com', label: 'Compte Premium', badge: 'PREMIUM' },
                { email: 'provider_seed@test.com', label: 'Compte Fournisseur', badge: 'PROVIDER' },
              ].map(({ email: e, label, badge }) => (
                <button key={e} type="button" onClick={() => setEmail(e)} style={{
                  background: 'transparent', border: '1px solid var(--bg-border)', borderRadius: '8px',
                  padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', color: 'var(--text-primary)', fontSize: '12px',
                  transition: 'border-color 150ms'
                }}
                  onMouseEnter={el => el.currentTarget.style.borderColor = 'rgba(53,132,228,0.4)'}
                  onMouseLeave={el => el.currentTarget.style.borderColor = 'var(--bg-border)'}
                >
                  <span style={{ color: 'var(--primary-light)' }}>{e}</span>
                  <span className="badge badge-premium" style={{ fontSize: '9px' }}>{badge}</span>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
