// ─────────────────────────────────────────────────────────────
//  routes/index.js — Agrège toutes les routes sur /api
//  Référence : PorteOuverteV2/11_backend_conception.md §4
// ─────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();

router.use('/auth',              require('./auth.routes'));
router.use('/user',              require('./user.routes'));
router.use('/contents',          require('./content.routes'));
router.use('/hls',               require('./hls.routes'));
router.use('/audio',             require('./audio.routes'));
router.use('/download',          require('./download.routes'));
router.use('/history',           require('./history.routes'));
router.use('/tutorial/progress', require('./tutorial.routes'));
router.use('/payment',           require('./payment.routes'));
router.use('/provider',          require('./provider.routes'));
router.use('/admin',             require('./admin.routes'));

module.exports = router;
