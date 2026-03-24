// ─────────────────────────────────────────────────────────────
//  middlewares/isProvider.middleware.js
//  Re-exporte requireRole.js pour le rôle provider/admin
// ─────────────────────────────────────────────────────────────
const requireRole = require('./requireRole');
// provider ou admin
module.exports = requireRole('provider');
