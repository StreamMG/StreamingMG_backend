import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * CarouselRow — Scroll horizontal avec scroll-snap et boutons nav
 * Conforme à la maquette v2 : overflow hidden, snap start
 */
export default function CarouselRow({ children }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const btnStyle = (show) => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 5,
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(23,27,38,0.9)',
    border: '1px solid var(--bg-border)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: show ? 1 : 0,
    pointerEvents: show ? 'auto' : 'none',
    transition: 'opacity 200ms, background 150ms, border-color 150ms',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  });

  return (
    <div className="carousel-wrap" style={{ position: 'relative' }}>
      {/* Left arrow */}
      <button
        style={{ ...btnStyle(canScrollLeft), left: '-12px' }}
        onClick={() => scroll('left')}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(53,132,228,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.background = 'rgba(23,27,38,0.9)'; }}
        aria-label="Défiler à gauche"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Scrollable row */}
      <div ref={scrollRef} className="cards-row">
        {children}
      </div>

      {/* Right arrow */}
      <button
        style={{ ...btnStyle(canScrollRight), right: '-12px' }}
        onClick={() => scroll('right')}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(53,132,228,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.background = 'rgba(23,27,38,0.9)'; }}
        aria-label="Défiler à droite"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
