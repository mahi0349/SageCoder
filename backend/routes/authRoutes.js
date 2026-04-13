import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();
const router = express.Router();

// Initiate GitHub login
// We request 'repo' scope to be able to read user's repositories
router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

// GitHub callback
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign({ id: req.user._id, githubId: req.user.githubId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Middleware to verify token and protect routes
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id); // We keep accessToken for internal github API calls if needed
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized, user not found' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized, token failed' });
  }
};

// Get current logged in user
router.get('/me', protect, (req, res) => {
  // Don't send accessToken to frontend
  const { accessToken, ...userWithoutToken } = req.user.toObject();
  res.json(userWithoutToken);
});

// Logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
});

export default router;
