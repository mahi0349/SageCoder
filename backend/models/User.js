import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: { type: String },
  profileUrl: { type: String },
  accessToken: { type: String, required: true }, // Store GitHub token to fetch private repos if needed
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
export default User;
