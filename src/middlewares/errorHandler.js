// ─────────────────────────────────────────────────────────────
//  middlewares/errorHandler.js — Gestionnaire d'erreurs global
// ─────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Erreur Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Fichier trop volumineux' });
  }

  // Erreur MIME Multer
  if (err.message && err.status === 400) {
    return res.status(400).json({ message: err.message });
  }

  // Erreur Mongoose — validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages[0], errors: messages });
  }

  // Erreur Mongoose — clé dupliquée
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ message: `${field} déjà utilisé` });
  }

  // Erreur Mongoose — CastError (ObjectId invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Identifiant invalide' });
  }

  // Erreur CORS
  if (err.message === 'CORS non autorisé') {
    return res.status(403).json({ message: err.message });
  }

  // Erreur générique
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err.stack);
  }

  res.status(status).json({ message });
};

module.exports = errorHandler;
