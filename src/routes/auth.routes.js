// ─────────────────────────────────────────────────────────────
//  routes/auth.routes.js — S2 : /api/auth
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, refresh, logout } = require('../controllers/authController');
const { authRequired } = require('../middlewares/auth');

// ── Validation register ──
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Nom d\'utilisateur invalide'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court (min 6 caractères)')
];

// ── Validation login ──
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

router.post('/register', registerValidation, register);
router.post('/login',    loginValidation,    login);
router.post('/refresh',  refresh);
router.post('/logout',   authRequired, logout);

module.exports = router;
