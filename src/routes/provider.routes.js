// routes/provider.routes.js — S3/S8 : /api/provider
const router = require('express').Router();
const {
  uploadContent, getMyContents, updateContent,
  replaceThumbnail, updateAccess, updateLessons, deleteContent
} = require('../controllers/providerController');
const { authRequired }   = require('../middlewares/auth');
const requireRole        = require('../middlewares/requireRole');
const validateThumbnail  = require('../middlewares/validateThumbnail');
const { uploadContent: multerUpload, uploadThumbnail } = require('../config/multer');

// Tous les providers doivent être authentifiés + avoir le rôle provider
router.use(authRequired, requireRole('provider', 'admin'));

// Upload avec multipart (thumbnail + media OBLIGATOIRES)
router.post(
  '/contents',
  (req, res, next) => multerUpload(req, res, (err) => {
    if (err) return next(err);
    next();
  }),
  validateThumbnail,
  uploadContent
);

router.get('/contents',                   getMyContents);
router.put('/contents/:id',               updateContent);

// Remplacer vignette seule
router.put(
  '/contents/:id/thumbnail',
  (req, res, next) => uploadThumbnail(req, res, (err) => {
    if (err) return next(err);
    next();
  }),
  replaceThumbnail
);

router.put('/contents/:id/access',    updateAccess);
router.put('/contents/:id/lessons',   updateLessons);
router.delete('/contents/:id',        deleteContent);

module.exports = router;
