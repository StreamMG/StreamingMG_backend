const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');
const { authOptional } = require('../middlewares/auth');
const checkAccess = require('../middlewares/checkAccess');

// Route protégée par checkAccess pour récupérer l'URL de streaming audio
// => GET /api/audio/:id/url
router.get('/:id/url', authOptional, checkAccess, audioController.getAudioUrl);

module.exports = router;
