const express = require('express');
const authController = require('../controllers/authController');
const { loginValidator, registerValidator } = require('../validators/authValidators');

const router = express.Router();

router.post('/login', loginValidator, authController.login);
router.post('/register', registerValidator, authController.register);

router.get('/is-user-logged-in', authController.isUserLoggedIn);
router.post('/logout', authController.logout);
router.post('/google-auth', authController.googleSso);

module.exports = router;

