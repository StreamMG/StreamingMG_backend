// ─────────────────────────────────────────────────────────────
//  routes/download.routes.js — S6 : /api/download + /private
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { requestDownload, servePrivateFile } = require('../controllers/downloadController');
const { authRequired } = require('../middlewares/auth');
const checkAccess       = require('../middlewares/checkAccess');
const validateSignedUrl = require('../middlewares/validateSignedUrl');

// ── Obtenir clé AES + URL signée ──
// JWT + checkAccess → retourne { aesKeyHex, ivHex, signedUrl, expiresIn }
router.post('/:contentId', authRequired, checkAccess, requestDownload);

module.exports = router;
