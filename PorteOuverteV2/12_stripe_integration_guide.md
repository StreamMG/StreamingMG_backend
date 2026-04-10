# 💳 Guide d'Intégration Stripe (Frontend & Backend)

Ce document décrit en détail l'architecture des paiements sécurisés mise en place sur StreamMG, respectant les règles absolues du projet (notamment les règles **05**, **08** et **09**).

---

## 1. Vue d'Ensemble de l'Architecture

Notre plateforme implémente le modèle **PaymentIntent + Webwebhook** de Stripe. Ce modèle garantit que le Frontend ne manipule aucune donnée critique, et que le Backend n'accorde les accès vidéo qu'après validation certifiée par les serveurs centraux de Stripe.

### Le Cycle de Vie d'un Paiement :

1. **Intention (Frontend ➔ Backend)** : L'utilisateur clique sur "Acheter" ou "S'abonner".
2. **Création (Backend ➔ Stripe)** : Le backend chiffre le montant et l'utilisateur dans un `PaymentIntent`, et récupère une clé `client_secret`.
3. **Paiement (Frontend ➔ Stripe)** : Le Frontend utilise Stripe Elements/CardField avec le `client_secret` pour valider la carte bancaire.
4. **Validation (Stripe ➔ Backend)** : Stripe exécute une requête `POST /api/payment/webhook` invisible au frontend pour notifier le succès de la transaction.
5. **Déblocage (Backend ➔ BDD)** : Le Backend déverrouille l'accès vidéo de façon permanente avec Idempotence absolue.

---

## 2. Intégration Backend (Système Actuel)

Le code Backend est situé dans `src/services/stripe.service.js` et `src/controllers/payment.controller.js`.

### 🛡️ RÈGLE-09 : Idempotence des Achats Unitaires
Lorsqu'un utilisateur initie l'achat d'un contenu payant :
```javascript
// POST /api/payment/purchase
const existing = await Purchase.findOne({ userId, contentId });
if (existing) {
  return res.status(409).json({ message: 'Vous avez déjà acheté ce contenu' });
}
```
*Le backend bloquera purement et simplement toute tentative de double achat sur un même compte pour un même contenu, **avant même de contacter Stripe**.*

### 🛡️ RÈGLE-08 : Routage Webhook intelligent 
Lorsque Stripe confirme que la banque a accepté l'argent, il précise le type de transaction (`metadata.type`).

Si `type === 'subscription'` :
- La base de données `User` est mise à jour avec `role: "premium"`, `isPremium: true` et expiration `premiumExpiry` fixée à +30 jours.

Si `type === 'purchase'` :
- Un document irréversible est créé dans la collection `Purchase` (vérifié par la `RÈGLE-05` pour accorder l'accès HLS aux Contenus `paid`).

---

## 3. Intégration Frontend (Web & Mobile)

Le développeur Frontend (Membre 2 / Mobile ou Membre 4 / Web) doit suivre ces étapes à la lettre pour orchestrer les paiements.

### A. Flux Web (React.js / Vite) avec `@stripe/react-stripe-js`

1. **Demander le `client_secret` :**
```javascript
const response = await api.post('/payment/purchase', { contentId: '...' });
const { clientSecret } = response.data;
```

2. **Afficher l'Élément Stripe :**
Injectez le secret dans le provider Stripe :
```jsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_votre_cle_publique');

<Elements stripe={stripePromise} options={{ clientSecret }}>
   <CheckoutForm />
</Elements>
```

3. **Demander le paiement final :**
Dans `CheckoutForm`, utilisez `stripe.confirmPayment()`. Attendez le succès, et proposez à l'utilisateur de "Rafraîchir" sa page vidéo, sachant que le Webhook (`api/payment/webhook`) s'exécute à la vitesse de la lumière !

### B. Flux Mobile (React Native / Expo) avec `@stripe/stripe-react-native`

1. **Initialiser le système :**
```javascript
import { initStripe } from '@stripe/stripe-react-native';

useEffect(() => {
  initStripe({ publishableKey: 'pk_test_votre_cle_publique' });
}, []);
```

2. **Collecter le Jeton :**
```javascript
const { data } = await api.post('/payment/subscribe', { plan: 'monthly' });
```

3. **Déclencher le Sheet d'Achat OS :**
```javascript
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

await initPaymentSheet({
  paymentIntentClientSecret: data.clientSecret,
  merchantDisplayName: 'StreamMG',
});

const { error } = await presentPaymentSheet();
if (!error) {
  // Paiement accepté ! Le Backend a reçu le Webhook
}
```

---

## 4. Test Hors-Ligne (Simulateur Local)

Pour tester complètement les transactions en l'absence de réseau, un simulateur a été développé sur le backend, permettant de forger des faux webhook cryptés.

1. **Clés `.env`** : Dans votre `.env` Backend, définissez `USE_MOCK_STRIPE=true`.
2. **Serveur Mock** : Exécutez `node scripts/stripe_mock_server.js` (port `3002`).
3. **Tester** : Lorsque vous envoyez un paiement, au lieu de joindre Stripe, votre application reçoit des validations auto-managées par le simulateur, avec une conformité JSON garantie à 100%. Merveilleux pour tester la réaction UX face à une Erreur de Carte Bancaire en plein stream.
