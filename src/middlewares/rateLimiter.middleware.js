// ─────────────────────────────────────────────────────────────
//  middlewares/rateLimiter.middleware.js
//  Rate limiting : /api/auth (10/15min) · /api (200/15min)
// ─────────────────────────────────────────────────────────────
const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // max: 10,
  max: 10000000000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.', code: 'RATE_LIMIT' },
});

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de requêtes.', code: 'RATE_LIMIT' },
});
