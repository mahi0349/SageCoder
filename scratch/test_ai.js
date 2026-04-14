import dotenv from 'dotenv';
import { analyzeRepository } from './backend/services/aiService.js';

dotenv.config({ path: './backend/.env' });

const testFiles = [
  { path: 'test.js', content: 'console.log("hello world");' }
];

analyzeRepository(testFiles)
  .then(res => console.log('Success:', res))
  .catch(err => console.error('Failed:', err));
