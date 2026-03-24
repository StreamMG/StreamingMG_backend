// ─────────────────────────────────────────────────────────────
//  middlewares/multer.middleware.js — MIME + taille + UUID filename
//  Référence : PorteOuverteV2/11_backend_conception.md §5
//  RÈGLE-03 : thumbnail obligatoire (vérifiée par thumbnailCheck)
// ─────────────────────────────────────────────────────────────
const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

const ALLOWED = {
  thumbnail: ['image/jpeg', 'image/png'],
  video:     ['video/mp4', 'video/quicktime'],
  audio:     ['audio/mpeg', 'audio/aac', 'audio/wav', 'audio/mp3'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail')
      cb(null, 'uploads/thumbnails/');
    else if (ALLOWED.video.includes(file.mimetype))
      cb(null, 'uploads/private/');    // ⚠️ RÈGLE-02 : jamais de route publique
    else
      cb(null, 'uploads/audio/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req, file, cb) => {
  const all = [...ALLOWED.thumbnail, ...ALLOWED.video, ...ALLOWED.audio];
  if (all.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`MIME non autorisé : ${file.mimetype}`), false);
  }
};

// Upload contenu complet : thumbnail ★ OBLIGATOIRE + media
exports.uploadContent = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_VIDEO_MB || 500) * 1024 * 1024 },
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'media',     maxCount: 1 },
]);

// Upload thumbnail seule (remplacement)
exports.uploadThumbnail = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_THUMBNAIL_MB || 5) * 1024 * 1024 },
}).fields([
  { name: 'thumbnail', maxCount: 1 },
]);
