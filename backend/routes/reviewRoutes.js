import express from 'express';
import { protect } from './authRoutes.js';
import { analyzeCode } from '../services/aiService.js';
import Review from '../models/Review.js';

const router = express.Router();

// POST /api/reviews
// Submit code for AI review
router.post('/', protect, async (req, res) => {
  try {
    const { codeSnippet, fileName, repoName } = req.body;

    if (!codeSnippet) {
      return res.status(400).json({ message: 'Code snippet is required' });
    }

    // Call the Gemini API to get feedback
    const feedback = await analyzeCode(codeSnippet, fileName);

    // Save review to the database
    const review = new Review({
      userId: req.user._id,
      repoName: repoName || 'Manual Input',
      fileName: fileName || 'snippet',
      codeSnippet,
      feedback
    });

    await review.save();

    res.status(201).json(review);
  } catch (error) {
    console.error('Error in code review route:', error);
    res.status(500).json({ message: error.message || 'Failed to review code' });
  }
});

// GET /api/reviews
// Get past reviews for the logged in user
router.get('/', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stored reviews' });
  }
});

export default router;
