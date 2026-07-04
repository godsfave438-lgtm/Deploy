const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { register, login, resetPassword, me } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', auth, me);

module.exports = router;
