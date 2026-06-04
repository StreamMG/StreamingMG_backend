import React from 'react';
import { AlertTriangle, Check, X, Trash2, Lock, Crown } from 'lucide-react';

/**
 * ConfirmDialog - Modal de validation flottante pour les actions critiques
 * Utilisé dans Provider et Admin pour confirmer suppressions, approbations, etc.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger', // danger | warning | success | info
  icon
}) {
  if (!isOpen) return null;

  const variants = {
    danger: {
      iconBg: 'rgba(237,51,59,0.15)',
      iconBorder: 'rgba(237,51,59,0.3)',
      iconColor: 'var(--error)',
      btnBg: 'var(--error)',
      btnHover: '#c0392b',
      topBar: 'linear-gradient(90deg, #c0392b, var(--error), #e74c3c)'
    },
    warning: {
      iconBg: 'rgba(232,197,71,0.15)',
      iconBorder: 'rgba(232,197,71,0.3)',
      iconColor: 'var(--gold)',
      btnBg: 'var(--gold)',
      btnHover: '#d4ac0d',
      topBar: 'linear-gradient(90deg, #c9a227, var(--gold), #f5d96c)'
    },
    success: {
      iconBg: 'rgba(46,194,126,0.15)',
      iconBorder: 'rgba(46,194,126,0.3)',
      iconColor: 'var(--teal)',
      btnBg: 'var(--teal)',
      btnHover: '#27ae60',
      topBar: 'linear-gradient(90deg, #1a7348, var(--teal), #57e389)'
    },
    info: {
      iconBg: 'rgba(53,132,228,0.15)',
      iconBorder: 'rgba(53,132,228,0.3)',
      iconColor: 'var(--primary)',
      btnBg: 'var(--primary)',
      btnHover: '#2980b9',
      topBar: 'linear-gradient(90deg, #1c71d8, var(--primary), #62a0ea)'
    }
  };

  const style = variants[variant] || variants.danger;
  const defaultIcon = variant === 'danger' ? <AlertTriangle size={32} /> :
                      variant === 'warning' ? <Lock size={32} /> :
                      variant === 'success' ? <Check size={32} /> :
                      <AlertTriangle size={32} />;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      animation: 'fadeIn 200ms ease-out'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: '24px',
        padding: '0',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
        animation: 'slideUp 250ms ease-out',
        overflow: 'hidden'
      }}>
        {/* Top bar */}
        <div style={{ height: '3px', background: style.topBar }} />

        {/* Content */}
        <div style={{ padding: '36px 32px 32px' }}>
          {/* Icon */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: style.iconBg,
            border: `1px solid ${style.iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            color: style.iconColor
          }}>
            {icon || defaultIcon}
          </div>

          {/* Title */}
          <h3 style={{
            fontFamily: 'Sora',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '12px',
            lineHeight: 1.3
          }}>
            {title}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            {description}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '12px',
                border: '1px solid var(--bg-border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-raised)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '12px',
                border: 'none',
                background: style.btnBg,
                color: variant === 'warning' ? '#1a1000' : 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms',
                boxShadow: `0 4px 16px ${style.iconBg}`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = style.btnHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = style.btnBg;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
