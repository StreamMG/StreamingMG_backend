// ─────────────────────────────────────────────────────────────
//  config/cors.js — Origines CORS whitelist
//  Référence : PorteOuverteV2/11_backend_conception.md §15
// ─────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [
      process.env.CORS_ORIGIN_WEB,
      process.env.CORS_ORIGIN_DEV,
      'http://localhost:3001',
    ].filter(Boolean);

    // Autoriser les requêtes sans origine (Postman, mobile app)
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS non autorisé pour : ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
};

module.exports = corsOptions;
