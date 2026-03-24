// routes/payment.routes.js — S7 : /api/payment
const router = require('express').Router();
const {
  subscribe, createPurchase, handleWebhook, getPurchases, getStatus
} = require('../controllers/paymentController');
const { authRequired } = require('../middlewares/auth');

// ⚠️ Webhook : route sans authRequired — vérifié par signature Stripe
// express.raw() est appliqué dans app.js AVANT express.json()
router.post('/webhook',  handleWebhook);

router.post('/subscribe', authRequired, subscribe);
router.post('/purchase',  authRequired, createPurchase);
router.get('/purchases',  authRequired, getPurchases);
router.get('/status',     authRequired, getStatus);

module.exports = router;
