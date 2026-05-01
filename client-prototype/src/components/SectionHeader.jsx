import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * SectionHeader — En-tête de section fidèle à la maquette v2
 * Label (uppercase accent) + Title (Sora bold) + Sub (muted) + "Voir tout" button
 */
export default function SectionHeader({ label, title, sub, onSeeAll, seeAllTo }) {
  const Wrapper = seeAllTo ? 'a' : 'button';

  return (
    <div className="section-header">
      <div className="section-title-wrap">
        {label && <div className="section-label">{label}</div>}
        <div className="section-title">{title}</div>
        {sub && <div style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          marginTop: '1px',
        }}>{sub}</div>}
      </div>

      {(onSeeAll || seeAllTo) && (
        <Wrapper
          {...(seeAllTo ? { href: seeAllTo } : { onClick: onSeeAll })}
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--primary-light)',
            background: 'transparent',
            padding: '6px 12px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background 150ms',
            border: 'none',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(53,132,228,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Voir tout
          <ChevronRight size={14} style={{ transition: 'transform 200ms' }} />
        </Wrapper>
      )}
    </div>
  );
}
