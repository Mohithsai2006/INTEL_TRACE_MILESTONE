const express = require('express');
const router = express.Router();
const passport = require('passport'); // <-- ADDED
const jwt = require('jsonwebtoken'); // <-- ADDED

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/authController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Helper to generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


// --- Email/Password Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);

// --- Google OAuth Routes ---

// @desc    Auth with Google
// @route   GET /api/auth/google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }), // We use session: false because we use JWTs
  (req, res) => {
    // On successful auth, req.user is populated by Passport
    const token = generateToken(req.user._id);
    
    // Redirect to the frontend with the token
    res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
  }
);

module.exports = router;