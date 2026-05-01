import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Calendar, Clock, Crown, Star, ShoppingCart, History, Check } from 'lucide-react';
import api from '../api';

/* ─── Helpers ─── */
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDur = (s) => { if (!s) return '--'; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}min` : `${m} min`; };
const imgUrl = (p) => (!p ? '' : p.startsWith('http') ? p : `${import.meta.env.VITE_BASE_URL}${p}`);

/* ─── Tab button ─── */
const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '9px 18px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 400,
    background: active ? 'rgba(53,132,228,0.14)' : 'transparent',
    color: active ? 'var(--primary-light)' : 'var(--text-secondary)',
    transition: 'all 150ms',
  }}>
    {children}
  </button>
);

/* ─── Stat card ─── */
const StatCard = ({ value, label, icon, accent }) => (
  <div style={{
    flex: 1, padding: '20px 24px', background: 'var(--bg-surface)',
    border: `1px solid ${accent ? 'rgba(53,132,228,0.2)' : 'var(--bg-border)'}`,
    borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '4px',
    background: accent ? 'rgba(53,132,228,0.06)' : 'var(--bg-surface)',
  }}>
    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '6px' }}>{label}</div>
    <div style={{ fontFamily: 'Sora', fontSize: '28px', fontWeight: 800, color: accent ? 'var(--primary-light)' : 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
  </div>
);

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      api.get('/user/profile').then(r => setProfile(r.data)).catch(() => {}),
      api.get('/history').then(r => setHistory(r.data.history || [])).catch(() => {}),
      api.get('/payment/purchases').then(r => setPurchases(r.data.purchases || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
      <User size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
      <p>Impossible de charger le profil.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '940px', margin: '0 auto', padding: '40px 32px 80px' }}>

      {/* ─── Profile header ─── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
        borderRadius: '24px', padding: '36px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: profile.isPremium ? 'radial-gradient(ellipse, rgba(232,197,71,0.08) 0%, transparent 70%)' : 'radial-gradient(ellipse, rgba(53,132,228,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Avatar */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary-muted), var(--primary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Sora', fontSize: '28px', fontWeight: 800, color: 'white',
          border: `3px solid ${profile.isPremium ? 'var(--gold)' : 'rgba(53,132,228,0.4)'}`,
          boxShadow: profile.isPremium ? '0 0 20px rgba(232,197,71,0.25)' : 'none',
          position: 'relative',
        }}>
          {profile.username?.substring(0, 2).toUpperCase()}
          {profile.isPremium && (
            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '18px' }}>★</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h1 style={{ fontFamily: 'Sora', fontSize: '24px', fontWeight: 700 }}>{profile.username}</h1>
            {profile.isPremium
              ? <span className="badge badge-premium">★ PREMIUM</span>
              : <span className="badge badge-free">{profile.role?.toUpperCase()}</span>
            }
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <Mail size={13} /> {profile.email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <Calendar size={13} /> Inscrit le {fmtDate(profile.createdAt)}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatCard value={profile.stats?.totalWatched || history.length} label="Vus" />
          <StatCard value={purchases.length} label="Achats" />
          <StatCard value={profile.stats?.tutorialsInProgress || 0} label="Tutoriels" accent />
        </div>
      </div>

      {/* ─── Premium banner ─── */}
      {profile.isPremium ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(26,61,110,0.5), rgba(53,132,228,0.15))',
          border: '1px solid rgba(232,197,71,0.25)', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>★</span>
            <div>
              <div style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 700, color: 'var(--gold)' }}>Abonnement Premium actif</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Valide jusqu'au {fmtDate(profile.premiumExpiry)}</div>
            </div>
          </div>
          <span className="badge badge-premium">Actif</span>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, rgba(26,61,110,0.3), rgba(13,16,24,0.5))',
          border: '1px solid rgba(232,197,71,0.15)', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Passez à Premium</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Débloquez tous les contenus Hira Gasy, documentaires, films exclusifs — dès 9 900 Ar/mois</div>
          </div>
          <Link to="/subscribe?type=subscription" style={{ height: '40px', padding: '0 20px', background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))', color: '#1a1000', fontWeight: 700, fontSize: '13px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', flexShrink: 0 }}>
            ★ S'abonner
          </Link>
        </div>
      )}

      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--bg-border)', marginBottom: '28px', paddingBottom: '2px' }}>
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>Vue d'ensemble</TabBtn>
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>Historique ({history.length})</TabBtn>
        <TabBtn active={tab === 'purchases'} onClick={() => setTab('purchases')}>Mes achats ({purchases.length})</TabBtn>
        <TabBtn active={tab === 'settings'} onClick={() => setTab('settings')}>Paramètres</TabBtn>
      </div>

      {/* ─── Overview ─── */}
      {tab === 'overview' && (
        <div>
          <h3 style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Activité récente</h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--bg-border)' }}>
              <History size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>Commencez à regarder des contenus</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.slice(0, 6).map(item => (
                <Link key={item._id} to={`/watch/${item.content?._id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: '12px', textDecoration: 'none', transition: 'border-color 150ms',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(53,132,228,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
                >
                  <img src={imgUrl(item.content?.thumbnail)} alt="" style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content?.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{fmtDate(item.watchedAt)}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: item.completed ? 'var(--teal)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {item.completed ? <><Check size={12} /> Terminé</> : `${Math.round((item.progress / item.content?.duration) * 100) || 0}%`}
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '60px', height: '3px', background: 'var(--bg-overlay)', borderRadius: '9999px', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${Math.round((item.progress / item.content?.duration) * 100) || 0}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', borderRadius: '9999px' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── History ─── */}
      {tab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {history.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <History size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} /><p>Aucun historique</p>
            </div>
          ) : history.map(item => (
            <Link key={item._id} to={`/watch/${item.content?._id}`} className="card">
              <div className="card-image-wrap">
                <img src={imgUrl(item.content?.thumbnail)} alt="" className="card-thumbnail" />
                <div className="card-play-overlay"><div className="card-play-btn" style={{ width: '36px', height: '36px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg></div></div>
                {/* Progress bar bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.15)', zIndex: 3 }}>
                  <div style={{ height: '100%', width: `${Math.round((item.progress / item.content?.duration) * 100) || 0}%`, background: 'var(--primary)' }} />
                </div>
              </div>
              <div className="card-info"><div className="card-title">{item.content?.title}</div><div className="card-meta">{fmtDate(item.watchedAt)}</div></div>
            </Link>
          ))}
        </div>
      )}

      {/* ─── Purchases ─── */}
      {tab === 'purchases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {purchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--bg-border)' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} /><p>Aucun achat pour le moment</p>
              <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>Explorer le catalogue</Link>
            </div>
          ) : purchases.map(p => (
            <Link key={p._id} to={`/watch/${p.contentId?._id}`} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px',
              background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
              borderRadius: '14px', textDecoration: 'none', transition: 'border-color 150ms',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(46,194,126,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
            >
              <img src={imgUrl(p.contentId?.thumbnail)} alt="" style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.contentId?.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Acheté le {fmtDate(p.purchasedAt)}</div>
              </div>
              <div style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 700, color: 'var(--teal)', flexShrink: 0 }}>{p.amount / 1000}k Ar</div>
              <span style={{ fontSize: '11px', color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}><Check size={12} /> Possédé</span>
            </Link>
          ))}
        </div>
      )}

      {/* ─── Settings ─── */}
      {tab === 'settings' && (
        <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { title: 'Informations personnelles', content: (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} onSubmit={e => e.preventDefault()}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '7px' }}>Nom d'utilisateur</label>
                  <input className="input-field" defaultValue={profile.username} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '7px' }}>Email</label>
                  <input className="input-field" type="email" defaultValue={profile.email} disabled style={{ opacity: 0.6 }} />
                </div>
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start', borderRadius: '10px' }}>Mettre à jour</button>
              </form>
            )},
            { title: 'Sécurité', content: (
              <button className="btn btn-secondary" style={{ borderRadius: '10px' }}>Changer le mot de passe</button>
            )},
            { title: 'Abonnement', content: profile.isPremium
              ? <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Premium actif jusqu'au <strong>{fmtDate(profile.premiumExpiry)}</strong></div>
              : <Link to="/subscribe?type=subscription" className="btn btn-primary" style={{ borderRadius: '10px', display: 'inline-flex' }}>★ S'abonner à Premium</Link>
            },
          ].map(({ title, content }) => (
            <div key={title} style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '16px', padding: '24px' }}>
              <h4 style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>{title}</h4>
              {content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
