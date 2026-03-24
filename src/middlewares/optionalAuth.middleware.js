// ─────────────────────────────────────────────────────────────
//  middlewares/optionalAuth.middleware.js — JWT facultatif
// ─────────────────────────────────────────────────────────────
const { verifyJWT } = require('../utils/jwt.utils');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { req.user = verifyJWT(header.split(' ')[1]); } catch {}
  }
  next();
};
