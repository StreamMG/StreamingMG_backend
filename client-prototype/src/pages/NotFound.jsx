import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', padding: '40px 20px', textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(237,51,59,0.05)', border: '1px solid rgba(237,51,59,0.1)',
        borderRadius: '24px', padding: '48px 40px', maxWidth: '440px', width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(237,51,59,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          color: 'var(--error)'
        }}>
          <ShieldAlert size={40} />
        </div>
        <h1 style={{ fontFamily: 'Sora', fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
          404 - Page Introuvable
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px', lineHeight: 1.6 }}>
          La page que vous recherchez n'existe pas ou vous n'avez pas l'autorisation d'y accéder.
        </p>
        <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
