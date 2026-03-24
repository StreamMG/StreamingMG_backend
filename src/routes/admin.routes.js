// routes/admin.routes.js — S8 : /api/admin
const router = require('express').Router();
const {
  getAllContents, updateContent, deleteContent, getStats, getUsers, updateUser
} = require('../controllers/adminController');
const { authRequired } = require('../middlewares/auth');
const requireRole      = require('../middlewares/requireRole');

router.use(authRequired, requireRole('admin'));

router.get('/contents',       getAllContents);
router.put('/contents/:id',   updateContent);
router.delete('/contents/:id', deleteContent);
router.get('/stats',          getStats);
router.get('/users',          getUsers);
router.put('/users/:id',      updateUser);

module.exports = router;
