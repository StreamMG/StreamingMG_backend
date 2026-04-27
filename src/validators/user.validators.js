const { body } = require('express-validator');

exports.updateProfileRules = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage("Nom d'utilisateur invalide"),
];

exports.changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 8 }).withMessage('Nouveau mot de passe trop faible'),
];
