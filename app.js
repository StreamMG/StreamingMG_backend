// ─────────────────────────────────────────────────────────────
//  app.js — Configuration Express + Middlewares globaux
// ─────────────────────────────────────────────────────────────
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path         = require('path');

const errorHandler = require("./src/middlewares/errorHandler");
const validateSignedUrl = require("./src/middlewares/validateSignedUrl");
const { servePrivateFile } = require("./src/controllers/downloadController");

// ── Import routes ──
const authRoutes = require("./src/routes/auth.routes");
const contentRoutes = require("./src/routes/content.routes");
const hlsRoutes = require("./src/routes/hls.routes");
const downloadRoutes = require("./src/routes/download.routes");
const historyRoutes = require("./src/routes/history.routes");
const tutorialRoutes = require("./src/routes/tutorial.routes");
const paymentRoutes = require("./src/routes/payment.routes");
const providerRoutes = require("./src/routes/provider.routes");
const adminRoutes = require("./src/routes/admin.routes");

const app = express();

// ── Sécurité headers (Helmet) ──
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "blob:", "http:", "https:"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: { maxAge: 31536000 },
  }),
);

// ── CORS ──
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, mobile)
      if (!origin) return callback(null, true);
      
      // Nettoyer l'origine (enlever le slash final)
      const cleanOrigin = origin.replace(/\/$/, "");
      
      // Check si localhost ou inclus dans allowedOrigins
      if (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1') || allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      
      console.warn('CORS Blocked:', origin);
      callback(new Error("CORS non autorisé"));
    },
    credentials: true,
  }),
);

// ── Rate limiting ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000000000000,
  message: { message: "Trop de tentatives. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Trop de requêtes. Réessayez plus tard." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Webhook Stripe AVANT express.json() — express.raw() requis ──
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

// ── Body parsers ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Fichiers statiques publics ──
app.use(
  "/uploads/thumbnails",
  express.static(path.join(__dirname, "uploads/thumbnails")),
);
app.use(
  "/uploads/audio",
  express.static(path.join(__dirname, "uploads/audio")),
);

// /uploads/hls → protégé par hlsTokenizer (dans les routes HLS)
// /uploads/private → AUCUNE route statique !

// ── Rate limiting appliqué ──
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// ── Routes ──
const hlsFilesRouter = require("./src/routes/hlsFiles.routes");

app.use("/api/auth", authRoutes);
app.use("/api/contents", contentRoutes);
app.use("/api/hls", hlsRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/tutorial", tutorialRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/admin", adminRoutes);

// ── Route HLS statiques — /hls/:contentId/* (token requis via hlsTokenizer) ──
app.use("/hls/:contentId", hlsFilesRouter);

// ── Route fichiers privés — /private/:contentId (URL signée HMAC requise) ──
// TF-HLS-05 : /uploads/private/ n'est PAS servi par Express static
app.get("/private/:contentId", validateSignedUrl, servePrivateFile);

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 10. GESTION D'ERREURS GLOBALE
app.use(errorHandler);

module.exports = app;