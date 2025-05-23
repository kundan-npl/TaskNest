const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, resetPassword, updatePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth/auth');

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
