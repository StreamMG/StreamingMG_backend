// ─────────────────────────────────────────────────────────────
//  app.js — Configuration Express + Middlewares globaux
// ─────────────────────────────────────────────────────────────
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path         = require('path');

const errorHandler = require('./src/middlewares/errorHandler');
const validateSignedUrl = require('./src/middlewares/validateSignedUrl');
const { servePrivateFile } = require('./src/controllers/downloadController');

// ── Import routes ──
const authRoutes     = require('./src/routes/auth.routes');
const contentRoutes  = require('./src/routes/content.routes');
const hlsRoutes      = require('./src/routes/hls.routes');
const downloadRoutes = require('./src/routes/download.routes');
const historyRoutes  = require('./src/routes/history.routes');
const tutorialRoutes = require('./src/routes/tutorial.routes');
const paymentRoutes  = require('./src/routes/payment.routes');
const providerRoutes = require('./src/routes/provider.routes');
const adminRoutes    = require('./src/routes/admin.routes');
const hlsFilesRouter = require('./src/routes/hlsFiles.routes');

const app = express();

// 1. CORS - Configuré une seule fois correctement
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin === 'http://127.0.0.1:5173') {
      return callback(null, true);
    }
    callback(new Error('CORS non autorisé par la politique de sécurité'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. HELMET - Configuration adaptée pour le Streaming (Cross-Origin)
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé temporairement pour faciliter le test des flux HLS
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

// 3. WEBHOOK STRIPE (Doit être avant express.json)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// 4. BODY PARSERS
app.use(express.json({ limit: '50mb' })); // Augmenté pour les gros payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 5. FICHIERS STATIQUES (La clé de ton problème d'affichage)
// Ces lignes permettent au navigateur d'accéder aux fichiers physiques
app.use('/uploads/thumbnails', express.static(path.join(__dirname, 'uploads/thumbnails')));
app.use('/uploads/audio',      express.static(path.join(__dirname, 'uploads/audio')));
app.use('/hls',               express.static(path.join(__dirname, 'hls'))); 

// 6. RATE LIMITING
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Augmenté pour le développement
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// 7. ROUTES API
app.use('/api/auth',     authRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/hls',      hlsRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/history',  historyRoutes);
app.use('/api/tutorial', tutorialRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/admin',    adminRoutes);

// 8. ROUTES SPÉCIFIQUES (HLS & Privé)
// Utilise ton router hlsFiles pour gérer les accès segmentés
app.use('/hls/:contentId', hlsFilesRouter);

// Accès aux fichiers originaux via URL signée
app.get('/private/:contentId', validateSignedUrl, servePrivateFile);

// 9. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', serverTime: new Date().toISOString() });
});

// 10. GESTION D'ERREURS GLOBALE
app.use(errorHandler);

module.exports = app;