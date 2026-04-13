import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoName: { type: String, default: 'Manual Input' },
  fileName: { type: String, default: 'snippet' },
  codeSnippet: { type: String, required: true },
  feedback: {
    bugs: [{
      line: Number,
      issue: String,
      suggestion: String
    }],
    performance: [{
      line: Number,
      issue: String,
      suggestion: String
    }],
    clean_code: [{
      line: Number,
      issue: String,
      suggestion: String
    }]
  },
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
