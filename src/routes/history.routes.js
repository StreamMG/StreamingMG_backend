// routes/history.routes.js — S5 : /api/history
const router = require('express').Router();
const { recordHistory, getHistory } = require('../controllers/historyController');
const { authRequired } = require('../middlewares/auth');

router.post('/:contentId', authRequired, recordHistory);
router.get('/',            authRequired, getHistory);

module.exports = router;
