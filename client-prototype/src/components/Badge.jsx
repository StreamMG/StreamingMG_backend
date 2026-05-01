import React from 'react';

/**
 * Badge — 6 variants fidèles à la maquette StreamMG v2
 * Variants : premium, paid, free, tuto, new, default
 */

const STYLES = {
  premium: {
    background: 'rgba(26,61,110,0.9)',
    color: 'var(--gold)',
    border: '1px solid rgba(232,197,71,0.3)',
  },
  paid: {
    background: 'rgba(26,115,72,0.9)',
    color: 'var(--teal)',
    border: '1px solid rgba(46,194,126,0.3)',
  },
  free: {
    background: 'rgba(32,36,52,0.9)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--bg-border)',
  },
  tuto: {
    background: 'rgba(53,132,228,0.18)',
    color: 'var(--primary-light)',
    border: '1px solid rgba(53,132,228,0.3)',
  },
  new: {
    background: 'rgba(237,51,59,0.18)',
    color: '#ff6b75',
    border: '1px solid rgba(237,51,59,0.3)',
  },
  default: {
    background: 'rgba(42,47,66,0.8)',
    color: 'var(--text-primary)',
    border: '1px solid var(--bg-border)',
  },
};

const BASE_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '10px',
  fontWeight: 700,
  padding: '3px 7px',
  borderRadius: '5px',
  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
  whiteSpace: 'nowrap',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

export default function Badge({ variant = 'default', children, style }) {
  const variantStyle = STYLES[variant] || STYLES.default;

  return (
    <span style={{ ...BASE_STYLE, ...variantStyle, ...style }}>
      {children}
    </span>
  );
}

/**
 * Helper — renvoie le bon Badge selon le contenu
 */
export function AccessBadge({ content }) {
  if (!content) return null;

  if (content.accessType === 'premium') {
    return <Badge variant="premium">★ Premium</Badge>;
  }
  if (content.accessType === 'paid') {
    const price = content.price >= 1000
      ? `${(content.price / 1000).toFixed(0)}k Ar`
      : `${content.price} Ar`;
    return <Badge variant="paid">{price}</Badge>;
  }
  return <Badge variant="free">Gratuit</Badge>;
}
