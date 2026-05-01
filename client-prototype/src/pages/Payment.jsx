import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, Check, AlertCircle, Lock, Star, ShoppingCart } from 'lucide-react';
import api from '../api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK || 'pk_test_placeholder');

/* ─── Stripe card element style ─── */
const CARD_STYLE = {
  style: {
    base: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '16px',
      color: '#eef0f6',
      '::placeholder': { color: '#545d6e' },
      iconColor: '#62a0ea',
    },
    invalid: { color: '#ff6b75', iconColor: '#ff6b75' },
  },
};

/* ─── Composant formulaire carte ─── */
function StripeCardForm({ onPay, loading, amount, label }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setCardError(null);
    const cardEl = elements.getElement(CardElement);
    await onPay(stripe, cardEl, setCardError);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Card element */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--bg-raised)',
        border: '1px solid var(--bg-border)',
        borderRadius: '12px',
        transition: 'border-color 200ms',
      }}>
        <CardElement options={CARD_STYLE} />
      </div>

      {cardError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b75', fontSize: '13px' }}>
          <AlertCircle size={14} /> {cardError}
        </div>
      )}

      {/* Test hint */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(53,132,228,0.06)', border: '1px solid rgba(53,132,228,0.15)',
        borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)'
      }}>
        <AlertCircle size={13} style={{ color: 'var(--info)', flexShrink: 0 }} />
        Mode test — utilisez la carte <strong style={{ color: 'var(--text-secondary)' }}>4242 4242 4242 4242</strong>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', height: '50px', fontSize: '15px', borderRadius: '14px' }}
        disabled={!stripe || loading}
      >
        {loading ? 'Traitement...' : `Payer ${amount}`}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <Lock size={12} /> Paiement sécurisé via Stripe
      </div>
    </form>
  );
}

/* ─── Écran succès ─── */
function SuccessScreen({ message, redirectTo, navigate }) {
  useEffect(() => {
    const t = setTimeout(() => navigate(redirectTo), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '48px 32px' }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'rgba(46,194,126,0.12)', border: '2px solid var(--teal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
      }}>
        <Check size={36} color="var(--teal)" />
      </div>
      <h2 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, marginBottom: '10px' }}>Paiement réussi !</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{message}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>Redirection en cours…</p>
    </div>
  );
}

/* ─── Page principale ─── */
const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contentId = searchParams.get('contentId');
  const type = searchParams.get('type') || 'subscription'; // subscription | purchase

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(type === 'purchase');
  const [plan, setPlan] = useState('monthly');
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (type === 'purchase' && contentId) {
      api.get(`/contents/${contentId}`)
        .then(res => setContent(res.data.content))
        .catch(() => {})
        .finally(() => setPageLoading(false));
    }
  }, [type, contentId]);

  /* ─── Handler abonnement ─── */
  const handleSubscribe = async (stripe, cardEl, setCardError) => {
    setLoading(true);
    try {
      const res = await api.post('/payment/subscribe', { plan });
      const { clientSecret } = res.data;
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl, billing_details: { name: 'Abonné StreamMG' } },
      });
      if (error) { setCardError(error.message); }
      else if (paymentIntent.status === 'succeeded') { setSucceeded(true); }
    } catch (err) {
      setCardError(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Handler achat unitaire ─── */
  const handlePurchase = async (stripe, cardEl, setCardError) => {
    setLoading(true);
    try {
      const res = await api.post('/payment/purchase', { contentId });
      const { clientSecret } = res.data;
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl, billing_details: { name: 'Acheteur StreamMG' } },
      });
      if (error) { setCardError(error.message); }
      else if (paymentIntent.status === 'succeeded') { setSucceeded(true); }
    } catch (err) {
      setCardError(err.response?.data?.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  return (
    <div style={{
      minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      background: 'radial-gradient(ellipse at top right, rgba(53,132,228,0.07) 0%, transparent 55%), var(--bg-base)'
    }}>
      <div style={{ width: '100%', maxWidth: type === 'subscription' ? '780px' : '520px' }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Retour au catalogue
        </Link>

        {/* ─── ABONNEMENT ─── */}
        {type === 'subscription' && (
          succeeded
            ? <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px' }}>
                <SuccessScreen message="Votre abonnement Premium est maintenant actif. Profitez de tous les contenus !" redirectTo="/profile" navigate={navigate} />
              </div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

                {/* Left — Plans */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px', overflow: 'hidden' }}>
                  {/* Gold top bar */}
                  <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light))' }} />
                  {/* Gold ambient */}
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(ellipse, var(--gold-muted) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ padding: '36px 32px' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(232,197,71,0.12)', border: '1px solid rgba(232,197,71,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>★</div>
                      <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Abonnement Premium</h1>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                        Accédez à tous les contenus premium sans limitation. Hira Gasy, documentaires exclusifs, films malagasy 4K.
                      </p>

                      {/* Plan selector */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                        {[
                          { id: 'monthly', name: 'Mensuel', price: '9 900 Ar', sub: '/mois', saving: null },
                          { id: 'yearly', name: 'Annuel', price: '99 000 Ar', sub: '/an', saving: '2 mois offerts' },
                        ].map(p => (
                          <button key={p.id} onClick={() => setPlan(p.id)} style={{
                            padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                            background: plan === p.id ? 'rgba(53,132,228,0.1)' : 'var(--bg-raised)',
                            border: `1px solid ${plan === p.id ? 'var(--primary)' : 'var(--bg-border)'}`,
                            transition: 'all 150ms', position: 'relative'
                          }}>
                            {p.saving && <span style={{ position: 'absolute', top: '-8px', right: '8px', background: 'var(--gold)', color: '#1a1000', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.saving}</span>}
                            <div style={{ fontFamily: 'Sora', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{p.name}</div>
                            <div style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: plan === p.id ? 'var(--gold)' : 'var(--text-primary)', lineHeight: 1 }}>{p.price}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.sub}</div>
                          </button>
                        ))}
                      </div>

                      {/* Benefits */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          'Accès illimité aux contenus premium',
                          'Documentaires exclusifs en 4K',
                          'Hira Gasy, Salegy, Tsapiky complets',
                          'Tutoriels langue et culture malagasy',
                          'Qualité maximale sans publicité',
                        ].map(b => (
                          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <Check size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} /> {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right — Paiement */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <h2 style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Informations de paiement</h2>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                    <span style={{ fontFamily: 'Sora', fontSize: '32px', fontWeight: 800, color: 'var(--gold)' }}>
                      {plan === 'monthly' ? '9 900' : '99 000'}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Ar {plan === 'monthly' ? '/mois' : '/an'}</span>
                  </div>
                  <Elements stripe={stripePromise}>
                    <StripeCardForm
                      onPay={handleSubscribe}
                      loading={loading}
                      amount={plan === 'monthly' ? '9 900 Ar' : '99 000 Ar'}
                      label="Souscrire"
                    />
                  </Elements>
                </div>
              </div>
            )
        )}

        {/* ─── ACHAT UNITAIRE ─── */}
        {type === 'purchase' && (
          succeeded
            ? <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px' }}>
                <SuccessScreen message="Vous pouvez regarder ce contenu à tout moment, sans limite !" redirectTo={`/watch/${contentId}`} navigate={navigate} />
              </div>
            : (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px', overflow: 'hidden' }}>
                {/* Teal top bar */}
                <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--teal-dark), var(--teal), var(--teal-light))' }} />
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(ellipse, var(--teal-muted) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  <div style={{ padding: '36px 32px' }}>
                    {content ? (
                      <>
                        {/* Content preview */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '28px', padding: '16px', background: 'var(--bg-raised)', borderRadius: '14px', border: '1px solid var(--bg-border)' }}>
                          <img
                            src={content.thumbnail?.startsWith('http') ? content.thumbnail : `${import.meta.env.VITE_BASE_URL}${content.thumbnail}`}
                            alt={content.title}
                            style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{content.type === 'video' ? 'Vidéo' : 'Audio'} · {content.category}</div>
                          </div>
                          <div style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, color: 'var(--teal)', flexShrink: 0 }}>{content.price / 1000}k Ar</div>
                        </div>

                        <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--teal-muted)', border: '1px solid rgba(46,194,126,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '16px' }}>🔒</div>
                        <h1 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Achat permanent</h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '28px' }}>
                          Achetez ce contenu une seule fois pour un accès permanent, indépendant de votre abonnement.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '28px' }}>
                          <span style={{ fontFamily: 'Sora', fontSize: '40px', fontWeight: 800, color: 'var(--teal)', lineHeight: 1 }}>{content.price / 1000}</span>
                          <span style={{ fontSize: '18px', color: 'var(--teal)', fontWeight: 600 }}>000</span>
                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Ar · Accès permanent</span>
                        </div>

                        <Elements stripe={stripePromise}>
                          <StripeCardForm
                            onPay={handlePurchase}
                            loading={loading}
                            amount={`${content.price / 1000}k Ar`}
                            label="Acheter"
                          />
                        </Elements>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        <AlertCircle size={40} style={{ margin: '0 auto 16px' }} />
                        <p>Contenu introuvable.</p>
                        <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>Retour</Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
        )}

        {/* Fermer */}
        {!succeeded && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
              Annuler et revenir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
