import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import api from '../api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Nom d\'utilisateur requis';
    else if (formData.username.length < 3) newErrors.username = 'Minimum 3 caractères';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Minimum 8 caractères';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { username: formData.username, email: formData.email, password: formData.password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Une erreur est survenue' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const fieldStyle = (hasError) => ({
    paddingLeft: '42px',
    borderColor: hasError ? 'var(--error)' : undefined,
    boxShadow: hasError ? '0 0 0 3px rgba(237,51,59,0.15)' : undefined
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px',
      background: 'radial-gradient(ellipse at bottom right, rgba(46,194,126,0.06) 0%, transparent 50%), var(--bg-base)'
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(53,132,228,0.07) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(46,194,126,0.05) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px' }} className="animate-fade-in">
        <div style={{
          background: 'rgba(23, 27, 38, 0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--bg-border)', borderRadius: '24px',
          padding: '48px 40px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', gap: '10px' }}>
            <img src="/streammg_logo_mada_1777321847119.png" alt="StreamMG" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <span style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 800 }}>
              Stream<span style={{ color: 'var(--primary)' }}>MG</span>
            </span>
          </div>

          <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, textAlign: 'center', marginBottom: '6px' }}>Créer un compte</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '28px' }}>
            Rejoignez la communauté du patrimoine malagasy
          </p>

          {errors.submit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(237,51,59,0.1)', border: '1px solid rgba(237,51,59,0.25)', color: '#ff6b75', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
              <AlertCircle size={16} /> {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { name: 'username', label: "Nom d'utilisateur", type: 'text', icon: <User size={16} />, placeholder: 'monpseudo' },
              { name: 'email', label: 'Email', type: 'email', icon: <Mail size={16} />, placeholder: 'votre@email.com' },
            ].map(({ name, label, type, icon, placeholder }) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '7px' }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{icon}</span>
                  <input type={type} name={name} className="input-field" style={fieldStyle(errors[name])} value={formData[name]} onChange={handleChange} placeholder={placeholder} disabled={isLoading} />
                </div>
                {errors[name] && <span style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{errors[name]}</span>}
              </div>
            ))}

            {[
              { name: 'password', label: 'Mot de passe', show: showPassword, toggle: () => setShowPassword(!showPassword), placeholder: 'Min 8 caractères' },
              { name: 'confirmPassword', label: 'Confirmer le mot de passe', show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword), placeholder: 'Retapez votre mot de passe' },
            ].map(({ name, label, show, toggle, placeholder }) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '7px' }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type={show ? 'text' : 'password'} name={name} className="input-field" style={{ ...fieldStyle(errors[name]), paddingRight: '42px' }} value={formData[name]} onChange={handleChange} placeholder={placeholder} disabled={isLoading} />
                  <button type="button" onClick={toggle} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors[name] && <span style={{ fontSize: '12px', color: 'var(--error)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} />{errors[name]}</span>}
              </div>
            ))}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '15px', marginTop: '8px', borderRadius: '12px' }} disabled={isLoading}>
              {isLoading ? 'Inscription...' : "S'inscrire gratuitement"}
            </button>
          </form>

          {/* Benefits */}
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Accès gratuit à des milliers de contenus', 'Découvrez Hira Gasy, Salegy, Tsapiky...', 'Suivez votre progression dans les tutoriels'].map(benefit => (
              <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Check size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                {benefit}
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
