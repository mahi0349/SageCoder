import mongoose from 'mongoose';

const repoReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoName: { type: String, required: true },
  owner: { type: String, required: true },
  branch: { type: String, required: true },
  
  // Overall metrics
  score: { type: Number, required: true }, // 0-100
  
  // Qualitative feedback
  summary: { type: String },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  recommendations: [{ type: String }],
  
  // Specific category scores
  categories: {
    architecture: { type: Number },
    security: { type: Number },
    maintainability: { type: Number },
    performance: { type: Number }
  },
  
  // Store the files that were analyzed for context
  analyzedFiles: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now }
});

const RepoReview = mongoose.model('RepoReview', repoReviewSchema);
export default RepoReview;
