const path = require('path');

/**
 * Construit le chemin public d'un fichier upload
 */
exports.buildPublicPath = (folder, filename) =>
  `/${folder}/${path.basename(filename)}`;

/**
 * Retourne l'extension d'un fichier en minuscules
 */
exports.ext = (filename) =>
  path.extname(filename).toLowerCase();
