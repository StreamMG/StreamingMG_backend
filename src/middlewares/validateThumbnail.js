// ─────────────────────────────────────────────────────────────
//  middlewares/validateThumbnail.js — Vignette OBLIGATOIRE
//  Triple protection : frontend → Multer → ici → Mongoose
// ─────────────────────────────────────────────────────────────
const validateThumbnail = (req, res, next) => {
  // Vérifier la présence du fichier thumbnail après Multer
  const hasThumbnail =
    (req.files?.thumbnail && req.files.thumbnail.length > 0) ||
    (req.file && req.file.fieldname === 'thumbnail');

  if (!hasThumbnail) {
    return res.status(400).json({ message: 'La vignette est obligatoire.' });
  }
  next();
};

module.exports = validateThumbnail;
