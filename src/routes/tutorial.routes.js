// routes/tutorial.routes.js — S5 : /api/tutorial
const router = require('express').Router();
const { updateProgress, getProgress } = require('../controllers/tutorialController');
const { authRequired } = require('../middlewares/auth');

router.post('/progress/:contentId', authRequired, updateProgress);
router.get('/progress',             authRequired, getProgress);

module.exports = router;
