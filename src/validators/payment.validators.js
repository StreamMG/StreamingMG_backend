const { body } = require('express-validator');

exports.purchaseRules = [
  body('contentId').isMongoId().withMessage('contentId invalide'),
];

exports.subscribeRules = [
  body('plan').isIn(['monthly', 'yearly']).withMessage('Plan invalide'),
];
