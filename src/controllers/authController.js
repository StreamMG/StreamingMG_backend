// ─────────────────────────────────────────────────────────────
//  controllers/authController.js — S2 : Auth JWT + Refresh Token
//  bcryptjs coût 12 — Rotation systématique des refresh tokens
// ─────────────────────────────────────────────────────────────
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const crypto       = require('crypto');
const User         = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');

// ── Helpers internes ──────────────────────────────────────────

const generateJwt = (user) => jwt.sign(
  { id: user._id, role: user.role, isPremium: user.isPremium },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRY || '15m' }
);

const createRefreshToken = async (userId, platform = 'web') => {
  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(rawToken, 12);
  const days = platform === 'mobile' ? 30 : 7;
  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  });
  return rawToken;
};

const setRefreshCookie = (res, rawToken) => {
  res.cookie('refreshToken', rawToken, {
    httpOnly:  true,
    secure:    true, // Requis pour sameSite: 'none'
    sameSite:  'none',
    maxAge:    7 * 24 * 60 * 60 * 1000
  });
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Vérif email unique
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    // Hash mot de passe — coût 12 (OWASP recommandé)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({ username, email, passwordHash });

    const token    = generateJwt(user);
    const platform = req.headers['x-platform'] || 'web';
    const rawToken = await createRefreshToken(user._id, platform);

    setRefreshCookie(res, rawToken);

    // TF-AUTH-01 : retourne 201, role: "user", passwordHash $2b$ en DB
    return res.status(201).json({
      token,
      // Mobile reçoit le refreshToken dans le body (pas de cookie)
      refreshToken: rawToken,
      user: user.toSafeObject()
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Select passwordHash explicitement (select: false dans le schéma)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token    = generateJwt(user);
    const platform = req.headers['x-platform'] || 'web';
    const rawToken = await createRefreshToken(user._id, platform);

    setRefreshCookie(res, rawToken);

    // TF-AUTH-03 : retourne 200, JWT + cookie httpOnly
    return res.json({
      token,
      refreshToken: rawToken,
      user: user.toSafeObject()
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/refresh — Rotation du Refresh Token
// ─────────────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    // Cookie (web) ou body (mobile — expo-secure-store)
    const rawToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!rawToken) {
      return res.status(401).json({ message: 'Refresh token requis' });
    }

    // Chercher tous les tokens non expirés et comparer le hash
    const tokenDocs = await RefreshToken.find({
      expiresAt: { $gt: new Date() }
    });

    let matchedDoc = null;
    for (const doc of tokenDocs) {
      const match = await bcrypt.compare(rawToken, doc.tokenHash);
      if (match) { matchedDoc = doc; break; }
    }

    if (!matchedDoc) {
      return res.status(401).json({ message: 'Refresh token invalide ou expiré' });
    }

    // ── ROTATION : supprimer l'ancien token ──
    await RefreshToken.deleteOne({ _id: matchedDoc._id });

    const user = await User.findById(matchedDoc.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Utilisateur introuvable ou désactivé' });
    }

    // Générer nouveau JWT + nouveau refresh token
    const platform    = req.headers['x-platform'] || 'web';
    const newJwt      = generateJwt(user);
    const newRawToken = await createRefreshToken(user._id, platform);

    setRefreshCookie(res, newRawToken);

    // TF-AUTH-04 : nouveau token, ancien supprimé de la DB
    return res.json({
      token:        newJwt,
      refreshToken: newRawToken
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies.refreshToken || req.body.refreshToken;

    if (rawToken) {
      // Supprimer le refresh token de la DB
      const tokenDocs = await RefreshToken.find({ userId: req.user?.id });
      for (const doc of tokenDocs) {
        const match = await bcrypt.compare(rawToken, doc.tokenHash);
        if (match) {
          await RefreshToken.deleteOne({ _id: doc._id });
          break;
        }
      }
    }

    // Effacer le cookie
    res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });

    // TF-AUTH-05 : 200, doc RefreshToken supprimé
    return res.json({ message: 'Déconnecté avec succès' });

  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout };
