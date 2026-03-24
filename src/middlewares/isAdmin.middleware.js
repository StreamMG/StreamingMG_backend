// ─────────────────────────────────────────────────────────────
//  middlewares/isAdmin.middleware.js
//  Re-exporte requireRole.js pour le rôle admin
// ─────────────────────────────────────────────────────────────
const requireRole = require('./requireRole');
module.exports = requireRole('admin');
