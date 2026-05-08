// ─────────────────────────────────────────────────────────────
//  middlewares/auth.js — Décodage JWT
//  Deux variantes : authRequired / authOptional
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

/**
 * authRequired — Route protégée (401 si token absent/invalide)
 */
const authRequired = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token d\'authentification requis' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;   // { id, role, isPremium, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
};

/**
 * authOptional — Route publique (req.user = null si pas de token)
 * Utilisé pour le catalogue, les contenus gratuits
 * ⚠️ Un token expiré ne doit PAS bloquer l'accès public → req.user = null
 */
const authOptional = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = header.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Token expiré ou invalide → accès anonyme sur routes publiques
    req.user = null;
  }
  next();
};

module.exports = { authRequired, authOptional };
