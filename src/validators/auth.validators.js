const { body } = require('express-validator');

exports.registerRules = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username 3–30 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe min 8 caractères'),
];

exports.loginRules = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];
