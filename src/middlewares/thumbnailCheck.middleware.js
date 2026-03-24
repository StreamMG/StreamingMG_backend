// ─────────────────────────────────────────────────────────────
//  middlewares/thumbnailCheck.middleware.js
//  RÈGLE-03 : Tout upload sans thumbnail → 400 AVANT toute autre opération
//  Placé APRÈS multer — vérifie req.files.thumbnail
// ─────────────────────────────────────────────────────────────
module.exports = (req, res, next) => {
  if (!req.files?.thumbnail?.length) {
    return res.status(400).json({
      success: false,
      message: 'La vignette (thumbnail) est obligatoire.',
      field:   'thumbnail',
      code:    'THUMBNAIL_REQUIRED',
    });
  }
  next();
};
