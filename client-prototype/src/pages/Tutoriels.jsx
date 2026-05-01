import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import api from '../api';
import SectionHeader from '../components/SectionHeader';
import ContentCard from '../components/ContentCard';
import CarouselRow from '../components/CarouselRow';

export default function Tutoriels() {
  const [tutorials, setTutorials] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/contents?isTutorial=true&limit=20').catch(() => ({ data: { contents: [] } })),
      api.get('/tutorial/progress').catch(() => ({ data: { inProgress: [] } }))
    ]).then(([tutRes, progRes]) => {
      setTutorials(tutRes.data.contents || []);
      setInProgress(progRes.data.inProgress || []);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const getProgressForTutorial = (tutorialId) => {
    const progress = inProgress.find(p => (p.contentId?._id || p.contentId) === tutorialId);
    return progress ? Math.round(progress.percentComplete || 0) : null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  // Objets en cours : mapper inProgress vers le format attendu par ContentCard
  // inProgress renvoie contentId complet.
  const inProgressContents = inProgress.map(p => p.contentId).filter(Boolean);

  return (
    <div style={{ maxWidth: '1480px', margin: '0 auto', padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: '56px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'Sora', fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Tutoriels & Apprentissage</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Apprenez la langue, la musique et la culture malagasy à votre rythme grâce à nos cours interactifs.
        </p>
      </div>

      {inProgressContents.length > 0 && (
        <section className="animate-fade-in">
          <SectionHeader
            label="Reprendre"
            title="Vos cours en cours"
            sub="Continuez là où vous vous étiez arrêté"
          />
          <CarouselRow>
            {inProgressContents.map(content => (
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

      <section className="animate-fade-in">
        <SectionHeader
          label="Catalogue"
          title="Tous les tutoriels"
          sub={`${tutorials.length} cours disponibles`}
        />
        {tutorials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--bg-border)' }}>
            <BookOpen size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.5 }} />
            <div style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)' }}>Aucun tutoriel disponible</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Revenez bientôt pour découvrir nos cours</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {tutorials.map(content => (
              <ContentCard
                key={content._id}
                content={content}
                variant="tutorial"
                progress={getProgressForTutorial(content._id)}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
