// ─────────────────────────────────────────────────────────────
//  config/multer.js — Configuration upload Multer
//  Thumbnail OBLIGATOIRE — JPEG/PNG ≤ 5Mo
//  Media : MP4 / MP3 / AAC ≤ 500Mo
// ─────────────────────────────────────────────────────────────
const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');
const fs     = require('fs');

// ── Dossiers de destination ──
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// ── Storage thumbnail ──
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/thumbnails');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(5).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    // Nom : titre_slugifié_<hash>.jpg
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 30);
    cb(null, `${base}_${uniqueSuffix}${ext}`);
  }
});

// ── Storage media (vidéo/audio) ──
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir;
    if (file.mimetype.startsWith('video/')) {
      dir = path.join(__dirname, '../uploads/private');
    } else {
      dir = path.join(__dirname, '../uploads/audio');
    }
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// ── Filtres MIME ──
const thumbnailFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  const err = new Error('Type MIME non autorisé. Utilisez JPEG ou PNG.');
  err.status = 400;
  cb(err, false);
};

const mediaFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/x-m4a'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  const err = new Error('Format media non autorisé.');
  err.status = 400;
  cb(err, false);
};

// ── Upload config principale (provider/contents) ──
const uploadContent = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let dir;
      if (file.fieldname === 'thumbnail') {
        dir = path.join(__dirname, '../uploads/thumbnails');
      } else if (file.mimetype.startsWith('video/')) {
        dir = path.join(__dirname, '../uploads/private');
      } else {
        dir = path.join(__dirname, '../uploads/audio');
      }
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      if (file.fieldname === 'thumbnail') {
        const base = path.basename(file.originalname, ext)
          .replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
        cb(null, `${base}_${uniqueSuffix}${ext}`);
      } else {
        cb(null, `${uniqueSuffix}${ext}`);
      }
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      return thumbnailFilter(req, file, cb);
    }
    return mediaFilter(req, file, cb);
  },
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE) || 524288000 // 500Mo par défaut
  }
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'media',     maxCount: 1 }
]);

// ── Upload thumbnail seule (PUT /provider/contents/:id/thumbnail) ──
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_THUMBNAIL_SIZE) || 5242880 // 5Mo
  }
}).single('thumbnail');

module.exports = { uploadContent, uploadThumbnail };
