import express from 'express';
import { protect } from './authRoutes.js';
import { analyzeCode, analyzeRepository } from '../services/aiService.js';
import Review from '../models/Review.js';
import RepoReview from '../models/RepoReview.js';
import { fetchRepoContext } from './githubRoutes.js';

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


// POST /api/reviews/repository
// Perform a full repository review
router.post('/repository', protect, async (req, res) => {
  try {
    const { owner, repo, branch } = req.body;

    if (!owner || !repo || !branch) {
      return res.status(400).json({ message: 'Owner, repo, and branch are required' });
    }

    // 1. Fetch the repository context (important files)
    const files = await fetchRepoContext(owner, repo, branch, req.user.accessToken);
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No relevant source files found for analysis.' });
    }

    // 2. Call the AI service for repo-level analysis
    const analysis = await analyzeRepository(files);

    // 3. Save to database
    const repoReview = new RepoReview({
      userId: req.user._id,
      repoName: repo,
      owner,
      branch,
      score: analysis.score,
      summary: analysis.summary,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations: analysis.recommendations,
      categories: analysis.categories,
      analyzedFiles: files.map(f => f.path)
    });

    await repoReview.save();

    res.status(201).json(repoReview);
  } catch (error) {
    console.error('Error in repo review route:', error);
    res.status(500).json({ message: error.message || 'Failed to review repository' });
  }
});

// GET /api/reviews/repository/:owner/:repo
// Get the latest repo review for a specific project
router.get('/repository/:owner/:repo', protect, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const review = await RepoReview.findOne({ 
      userId: req.user._id, 
      owner, 
      repoName: repo 
    }).sort({ createdAt: -1 });
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch repo review' });
  }
});

export default router;
