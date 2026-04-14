import express from 'express';
import axios from 'axios';
import { protect } from './authRoutes.js';

const router = express.Router();

// Helper function to handle github API requests
const fetchFromGithub = async (url, accessToken) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`GitHub API error: ${error.response.status} - ${error.response.data.message}`);
    }
    throw error;
  }
};

// GET /api/github/repos
// Fetch user's repositories (both public and private if scope allows)
router.get('/repos', protect, async (req, res) => {
  try {
    const url = 'https://api.github.com/user/repos?sort=updated&per_page=100';
    const repos = await fetchFromGithub(url, req.user.accessToken);
    res.json(repos);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching repositories' });
  }
});

// GET /api/github/repos/:owner/:repo
// Fetch specific repository details
router.get('/repos/:owner/:repo', protect, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const repoDetails = await fetchFromGithub(url, req.user.accessToken);
    res.json(repoDetails);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching repository details' });
  }
});

// GET /api/github/repos/:owner/:repo/tree/:branch
// Fetch a recursive tree of the repository for a given branch
router.get('/repos/:owner/:repo/tree/:branch', protect, async (req, res) => {
  try {
    const { owner, repo, branch } = req.params;
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const tree = await fetchFromGithub(url, req.user.accessToken);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching repository tree' });
  }
});

// GET /api/github/repos/:owner/:repo/contents
// Fetch file contents by path. Pass ?path=...&branch=...
router.get('/repos/:owner/:repo/contents', protect, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { path, branch } = req.query;
    
    if (!path) {
      return res.status(400).json({ message: 'Path is required as a query parameter' });
    }

    let url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    if (branch) {
      url += `?ref=${branch}`;
    }

    const contents = await fetchFromGithub(url, req.user.accessToken);
    res.json(contents);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching file contents' });
  }
});

// New helper to fetch multiple files for context
export const fetchRepoContext = async (owner, repo, branch, accessToken) => {
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const tree = await fetchFromGithub(treeUrl, accessToken);
  
  // Filter for relevant source files
  const relevantExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.html', '.css'];
  const excludeFolders = ['node_modules', 'dist', 'build', '.git', '.github', 'vendor'];
  
  const filesToFetch = tree.tree.filter(item => {
    if (item.type !== 'blob') return false;
    const isExcluded = excludeFolders.some(folder => item.path.includes(folder));
    const hasRightExt = relevantExtensions.some(ext => item.path.endsWith(ext));
    return hasRightExt && !isExcluded;
  })
  .slice(0, 20); // Limit to top 20 files to prevent context overload

  const fileContents = await Promise.all(
    filesToFetch.map(async (file) => {
      try {
        const contentData = await fetchFromGithub(
          `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path)}?ref=${branch}`,
          accessToken
        );
        return {
          path: file.path,
          content: Buffer.from(contentData.content, 'base64').toString('utf-8')
        };
      } catch (err) {
        console.error(`Failed to fetch ${file.path}:`, err.message);
        return null;
      }
    })
  );

  return fileContents.filter(f => f !== null);
};

// GET /api/github/repos/:owner/:repo/full-context
router.get('/repos/:owner/:repo/full-context', protect, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { branch } = req.query;
    
    if (!branch) {
      return res.status(400).json({ message: 'Branch is required' });
    }

    const context = await fetchRepoContext(owner, repo, branch, req.user.accessToken);
    res.json(context);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching full repository context' });
  }
});

export default router;
