// ─────────────────────────────────────────────────────────────
//  routes/download.routes.js — Pipeline mobile AES-256-GCM
//  Référence : PorteOuverteV2/11_backend_conception.md § 11
//
//  POST /api/download/:contentId
//    → auth → checkAccess → requestDownload
//    → retourne { aesKeyHex, ivHex, signedUrl, expiresIn }
//
//  GET /private/:contentId?expires=...&sig=...
//    → validateSignedUrl → servePrivateFile
//    → sert le fichier source avec support Range Requests
// ─────────────────────────────────────────────────────────────
const router            = require('express').Router();
const { authRequired }  = require('../middlewares/auth');
const checkAccess       = require('../middlewares/checkAccess');
const validateSignedUrl = require('../middlewares/validateSignedUrl');
const { requestDownload, servePrivateFile } = require('../controllers/downloadController');

// ── Obtenir credentials AES + URL signée ────────────────────
// JWT obligatoire + vérification droits d'accès (free/premium/paid)
router.post('/:contentId', authRequired, checkAccess, requestDownload);

module.exports = router;
