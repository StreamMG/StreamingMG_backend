import React from 'react';

/**
 * SearchPill — Barre de recherche de la topbar, fidèle maquette v2
 * Expand on focus: 200px → 280px, border glow
 */
export default function SearchPill({ value, onChange, onSubmit }) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit?.(value); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '36px',
        padding: '0 16px',
        background: 'rgba(32,36,52,0.7)',
        border: '1px solid var(--bg-border)',
        borderRadius: '9999px',
        cursor: 'text',
        transition: 'background 200ms, border-color 200ms, width 300ms, box-shadow 200ms',
        width: '200px',
        position: 'relative',
      }}
      onFocusCapture={e => {
        const form = e.currentTarget;
        form.style.background = 'var(--bg-raised)';
        form.style.borderColor = 'var(--primary)';
        form.style.boxShadow = '0 0 0 3px rgba(53,132,228,0.18)';
        form.style.width = '280px';
      }}
      onBlurCapture={e => {
        const form = e.currentTarget;
        form.style.background = 'rgba(32,36,52,0.7)';
        form.style.borderColor = 'var(--bg-border)';
        form.style.boxShadow = 'none';
        form.style.width = '200px';
      }}
    >
      <svg
        width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="var(--text-muted)" strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Rechercher…"
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--text-primary)',
          width: '100%',
        }}
      />
    </form>
  );
}
