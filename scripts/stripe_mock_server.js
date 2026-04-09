#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────
 *  scripts/stripe_mock_server.js
 *  Simulateur d'API Stripe (Offline) pour StreamMG
 * ─────────────────────────────────────────────────────────────
 */
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const http = require('http');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── 1. MOCK: Création de Payment Intent ──
app.post('/v1/payment_intents', (req, res) => {
  const id = 'pi_mock_' + Date.now();
  const amount = parseInt(req.body.amount || 0, 10);
  
  // Extraire les métadonnées de x-www-form-urlencoded (ex: metadata[type]=subscription)
  const metadata = {};
  for (const key in req.body) {
    if (key.startsWith('metadata[')) {
      const field = key.substring(9, key.length - 1);
      metadata[field] = req.body[key];
    }
  }

  const mockIntent = {
    id,
    object: 'payment_intent',
    amount,
    currency: req.body.currency || 'mga',
    client_secret: id + '_secret_mock',
    status: 'requires_payment_method',
    metadata
  };

  console.log(`[Stripe Mock] PaymentIntent créé : ${amount} Ar (Type: ${metadata.type})`);
  res.json(mockIntent);
});

// ── 2. ENDPOINT ADMIN: Déclencher un Webhook ──
app.post('/trigger-webhook', async (req, res) => {
  const { paymentIntentId, amount, metadata } = req.body;

  const eventPayload = {
    id: 'evt_mock_' + Date.now(),
    type: 'payment_intent.succeeded',
    apiVersion: '2024-04-10',
    data: {
      object: {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: amount || 500000,
        status: 'succeeded',
        metadata: metadata || {}
      }
    }
  };

  const payloadString = JSON.stringify(eventPayload);
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_simulated_secret_key';
  
  // Construction correcte de la signature Stripe
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  const stripeSignatureHeader = `t=${timestamp},v1=${signature}`;

  console.log(`[Stripe Mock] Emission Webhook payment_intent.succeeded vers localhost:3001...`);
  
  // Envoi asynchrone au backend StreamMG
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/payment/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString),
      'Stripe-Signature': stripeSignatureHeader
    }
  };

  const webhookReq = http.request(options, (webhookRes) => {
    let data = '';
    webhookRes.on('data', chunk => data += chunk);
    webhookRes.on('end', () => {
      console.log(`[Stripe Mock] Réponse Webhook backend (${webhookRes.statusCode}) : ${data}`);
      res.json({ success: true, backendStatus: webhookRes.statusCode, backendResponse: data });
    });
  });

  webhookReq.on('error', (err) => {
    console.error(`[Stripe Mock] Erreur Webhook: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  });

  webhookReq.write(payloadString);
  webhookReq.end();
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Stripe Mock Server démarré sur le port ${PORT}`);
  console.log(`Pointez STRIPE_MOCK_HOST vers localhost:${PORT} via USE_MOCK_STRIPE=true`);
});
