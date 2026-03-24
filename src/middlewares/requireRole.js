// ─────────────────────────────────────────────────────────────
//  middlewares/requireRole.js — Contrôle de rôle
//  Usage : router.use(requireRole('admin'))
//          router.use(requireRole('provider'))
//          router.use(requireRole('admin', 'provider'))
// ─────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Accès refusé — rôle requis : ${roles.join(' ou ')}`
    });
  }
  next();
};

module.exports = requireRole;
