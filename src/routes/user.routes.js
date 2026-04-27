const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const userValidators = require('../validators/user.validators');
const { validate } = require('../middlewares/validate.middleware');
const { authRequired } = require('../middlewares/auth.middleware');

// Routes protégées par JWT
router.use(authRequired);

router.get('/profile', userController.getProfile);

router.patch(
  '/profile',
  userController.updateProfile
);

router.patch(
  '/password',
  userController.changePassword
);

module.exports = router;
