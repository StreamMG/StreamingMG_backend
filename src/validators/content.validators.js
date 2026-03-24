const { body } = require('express-validator');

exports.uploadRules = [
  body('title').trim().notEmpty().withMessage('Titre requis'),
  body('type').isIn(['video', 'audio']).withMessage('Type invalide'),
  body('category').isIn(['film','salegy','hira-gasy','tsapiky','beko','documentaire','podcast','tutoriel','musique-contemporaine','autre']).withMessage('Catégorie invalide'),
  body('language').isIn(['mg', 'fr', 'bilingual']).withMessage('Langue invalide'),
  body('accessType').optional().isIn(['free','premium','paid']).withMessage('accessType invalide'),
  body('price').if(body('accessType').equals('paid')).isFloat({ min: 1 }).withMessage('price requis > 0 pour contenu payant'),
];
