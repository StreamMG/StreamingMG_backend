// ─────────────────────────────────────────────────────────────
//  routes/content.routes.js — S3 : /api/contents
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const {
  getContents, getFeatured, getTrending,
  getContentById, incrementView, getLessons
} = require('../controllers/contentController');
const { authOptional, authRequired } = require('../middlewares/auth');
const checkAccess = require('../middlewares/checkAccess');

// Routes publiques (authOptional pour infos utilisateur si connecté)
router.get('/',           authOptional, getContents);
router.get('/featured',   authOptional, getFeatured);
router.get('/trending',   authOptional, getTrending);
router.get('/:id',        authOptional, getContentById);
router.post('/:id/view',  incrementView);

// Route protégée — JWT + checkAccess
router.get('/:id/lessons', authOptional, checkAccess, getLessons);

module.exports = router;
