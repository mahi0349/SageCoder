import dotenv from 'dotenv';
import { analyzeRepository } from './services/aiService.js';

dotenv.config();

const testFiles = [
  { path: 'test.js', content: 'console.log("hello world");' }
];

analyzeRepository(testFiles)
  .then(res => console.log('Success:', res))
  .catch(err => console.error('Failed:', err.message));
