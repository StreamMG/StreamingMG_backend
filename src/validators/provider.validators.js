const { body } = require('express-validator');

exports.providerContentRules = [
  body('title').trim().notEmpty().withMessage('Titre requis'),
  body('type').isIn(['video', 'audio']).withMessage('Type invalide'),
  body('category').isIn(['film','salegy','hira-gasy','tsapiky','beko','documentaire','podcast','tutoriel','musique-contemporaine','autre']).withMessage('Catégorie invalide'),
];
