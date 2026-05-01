import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Lock } from 'lucide-react';

/**
 * AccessGate — Écran d'accès Premium ou Achat unitaire
 * Fidèle à la maquette v2 : radial glow, top bar gradient, icon, prix, CTA
 *
 * Variants : "premium" (gold) | "purchase" (teal)
 */

export default function AccessGate({
  variant = 'premium',
  title,
  description,
  price,
  period,
  ctaLabel,
  ctaTo,
  onDismiss,
  dismissLabel = 'Pas maintenant',
}) {
  const isPremium = variant === 'premium';

  const colors = isPremium
    ? {
        topBar: 'linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light))',
        glow: 'radial-gradient(ellipse, var(--gold-muted) 0%, transparent 70%)',
        iconBg: 'var(--gold-muted)',
        iconBorder: 'rgba(232,197,71,0.25)',
        priceColor: 'var(--gold)',
        btnBg: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
        btnColor: 'white',
        btnShadow: '0 4px 18px rgba(53,132,228,0.45)',
        btnHoverShadow: '0 6px 24px rgba(53,132,228,0.6)',
      }
    : {
        topBar: 'linear-gradient(90deg, var(--teal-dark), var(--teal), var(--teal-light))',
        glow: 'radial-gradient(ellipse, var(--teal-muted) 0%, transparent 70%)',
        iconBg: 'var(--teal-muted)',
        iconBorder: 'rgba(46,194,126,0.25)',
        priceColor: 'var(--teal)',
        btnBg: 'linear-gradient(135deg, var(--teal-dark), var(--teal))',
        btnColor: '#062a17',
        btnShadow: '0 4px 18px rgba(46,194,126,0.35)',
        btnHoverShadow: '0 6px 24px rgba(46,194,126,0.5)',
      };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-border)',
      borderRadius: '32px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top bar */}
      <div style={{ height: '2px', background: colors.topBar }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-80px',
        width: '260px',
        height: '260px',
        borderRadius: '9999px',
        background: colors.glow,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: colors.iconBg,
          border: `1px solid ${colors.iconBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          marginBottom: '20px',
        }}>
          {isPremium ? '★' : '🔒'}
        </div>

        <div style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '19px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}>
          {title}
        </div>

        <div style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '20px',
        }}>
          {description}
        </div>

        {/* Price */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '6px',
          marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '34px',
            fontWeight: 800,
            color: colors.priceColor,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            {price}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {period}
          </div>
        </div>

        {/* CTA button */}
        <Link
          to={ctaTo || '#'}
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'transform 150ms, box-shadow 150ms',
            marginBottom: '8px',
            background: colors.btnBg,
            color: colors.btnColor,
            boxShadow: colors.btnShadow,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = colors.btnHoverShadow;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = colors.btnShadow;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {ctaLabel}
        </Link>

        {/* Dismiss */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              width: '100%',
              height: '38px',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '13px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms, background 150ms',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--bg-raised)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {dismissLabel}
          </button>
        )}
      </div>
    </div>
  );
}
