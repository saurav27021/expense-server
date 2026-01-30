const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/google-login', authController.googleLogin);
router.get('/is-user-logged-in', authController.isUserLoggedIn);
router.post('/logout', authController.logout);

module.exports = router;
