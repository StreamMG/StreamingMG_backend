import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

/* ── Composants v2 ── */
import Hero from '../components/Hero';
import SectionHeader from '../components/SectionHeader';
import CarouselRow from '../components/CarouselRow';
import ContentCard from '../components/ContentCard';
import ContinueCard from '../components/ContinueCard';
import FeaturedGrid from '../components/FeaturedGrid';

/**
 * Catalogue — Page d'accueil StreamMG v2
 * 
 * 6 sections conformes à la maquette :
 *  1. Hero (full viewport)
 *  2. Continuer à regarder (historique)
 *  3. Musique Traditionnelle (audio, portrait cards)
 *  4. Films & Séries Malagasy (vidéo, wide cards)
 *  5. Tutoriels & Apprentissage (isTutorial, avec progress)
 *  6. Documentaires à la Une (featured grid)
 */

const Catalogue = () => {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [contents, setContents] = useState([]);
  const [history, setHistory] = useState([]);
  const [tutorialProgress, setTutorialProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/contents/featured').catch(() => ({ data: { featured: [] } })),
        api.get('/contents?limit=50').catch(() => ({ data: { contents: [] } })),
        api.get('/history?limit=10').catch(() => ({ data: { history: [] } })),
        api.get('/tutorial/progress').catch(() => ({ data: { inProgress: [] } })),
      ];

      const [featuredRes, allRes, historyRes, progressRes] = await Promise.all(requests);

      setFeatured(featuredRes.data.featured || []);
      setContents(allRes.data.contents || []);
      setHistory(historyRes.data.history || []);
      setTutorialProgress(progressRes.data.inProgress || []);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtres de contenu ──
  const audios = contents.filter(c => c.type === 'audio');
  const videos = contents.filter(c => c.type === 'video');
  const tutorials = contents.filter(c => c.isTutorial);
  const docs = contents.filter(c =>
    c.category === 'documentaire' || c.category === 'film'
  );

  // ── Hero data ──
  const mainFeatured = featured.length > 0 ? featured[0] : (contents.length > 0 ? contents[0] : null);
  const sideFeatured = featured.length > 1 ? featured.slice(1, 4) : contents.slice(1, 4);

  // ── Progress helper ──
  const getProgressForTutorial = (tutorialId) => {
    const p = tutorialProgress.find(tp =>
      (tp.contentId?._id || tp.contentId) === tutorialId
    );
    return p ? Math.round(p.percentComplete || 0) : null;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-base)',
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          1. HERO — Full viewport
          ═══════════════════════════════════════════════════════ */}
      <Hero
        mainContent={mainFeatured}
        sideContents={sideFeatured}
      />

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════ */}
      <main style={{
        maxWidth: '1480px',
        margin: '0 auto',
        padding: '0 40px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '56px',
      }}>

        {/* ───────────────────────────────────────────────────
            2. CONTINUER À REGARDER
            ─────────────────────────────────────────────────── */}
        {history.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader
              label="Reprendre"
              title="Continuer à regarder"
              sub={`${history.length} contenu${history.length > 1 ? 's' : ''} en cours`}
            />
            <CarouselRow>
              {history.map(item => (
                <ContinueCard key={item._id || item.content?._id} item={item} />
              ))}
            </CarouselRow>
          </section>
        )}

        {/* ───────────────────────────────────────────────────
            3. MUSIQUE TRADITIONNELLE — portrait cards
            ─────────────────────────────────────────────────── */}
        {audios.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader
              label="Patrimoine sonore"
              title="Musique Traditionnelle"
              sub="Hira Gasy · Salegy · Tsapiky · Beko"
              seeAllTo="/musique"
            />
            <CarouselRow>
              {audios.map(content => (
                <ContentCard
                  key={content._id}
                  content={content}
                  variant="portrait"
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {/* ───────────────────────────────────────────────────
            4. FILMS & SÉRIES MALAGASY — wide cards
            ─────────────────────────────────────────────────── */}
        {videos.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader
              label="Cinéma local"
              title="Films & Séries Malagasy"
              sub="Le meilleur du cinéma malagasy en streaming"
              seeAllTo="/explorer"
            />
            <CarouselRow>
              {videos.map(content => (
                <ContentCard
                  key={content._id}
                  content={content}
                  variant="wide"
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {/* ───────────────────────────────────────────────────
            5. TUTORIELS & APPRENTISSAGE — cards avec progress
            ─────────────────────────────────────────────────── */}
        {tutorials.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader
              label="Apprendre"
              title="Tutoriels & Apprentissage"
              sub="Langue, culture et musique malagasy"
              seeAllTo="/tutoriels"
            />
            <CarouselRow>
              {tutorials.map(content => (
                <ContentCard
                  key={content._id}
                  content={content}
                  variant="tutorial"
                  progress={getProgressForTutorial(content._id)}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {/* ───────────────────────────────────────────────────
            6. DOCUMENTAIRES À LA UNE — featured grid
            ─────────────────────────────────────────────────── */}
        {docs.length >= 3 && (
          <section className="animate-fade-in">
            <SectionHeader
              label="À ne pas manquer"
              title="Documentaires à la Une"
              sub="Explorez Madagascar en profondeur"
            />
            <FeaturedGrid items={docs.slice(0, 3)} />
          </section>
        )}

        {/* ── Fallback si aucun contenu ── */}
        {contents.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            color: 'var(--text-muted)',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.3,
            }}>🎬</div>
            <div style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}>
              Aucun contenu disponible
            </div>
            <p style={{ fontSize: '14px' }}>
              Revenez bientôt pour découvrir les contenus StreamMG
            </p>
          </div>
        )}
      </main>
    </>
  );
};

export default Catalogue;
