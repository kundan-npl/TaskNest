const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getMe, 
  forgotPassword, 
  resetPassword, 
  updatePassword,
  updateDetails,
  updateUserRole,
  getAllUsers,
  deactivateUser
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.put('/updatedetails', protect, updateDetails);

// Admin only routes
router.get('/users', protect, getAllUsers);
router.put('/users/:id/role', protect, updateUserRole);
router.put('/users/:id/deactivate', protect, deactivateUser);

module.exports = router;
