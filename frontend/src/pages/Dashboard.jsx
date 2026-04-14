import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../api';
import FileTree from '../components/FileTree';
import RepoHealthReport from '../components/RepoHealthReport';
import { Editor, useMonaco } from '@monaco-editor/react';
import { GitBranch, FolderGit2, Search, Loader2, Code2, Sparkles, LogOut, Bug, Zap, CheckCircle2, Shield } from 'lucide-react';

const getLanguage = (fileName) => {
  if (!fileName) return 'javascript';
  const ext = fileName.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python',
    go: 'go',
    java: 'java',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown'
  };
  return map[ext] || 'plaintext';
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoTree, setRepoTree] = useState([]);
  const [loadingTree, setLoadingTree] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);

  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  
  const [scanningRepo, setScanningRepo] = useState(false);
  const [repoReport, setRepoReport] = useState(null);
  const [showRepoReport, setShowRepoReport] = useState(false);

  const monaco = useMonaco();
  const editorRef = useRef(null);
  const [decorations, setDecorations] = useState([]);

  useEffect(() => {
    fetchApi('/auth/me')
      .then(data => setUser(data))
      .catch(err => console.error("Not authenticated", err));
      
    fetchApi('/github/repos')
      .then(data => {
        setRepos(data);
        setLoadingRepos(false);
      })
      .catch(err => {
        console.error("Failed to fetch repos", err);
        setLoadingRepos(false);
      });
  }, []);

  const handleRepoSelect = async (repo) => {
    setSelectedRepo(repo);
    setSelectedFile(null);
    setFileContent(null);
    setReviewResult(null);
    setLoadingTree(true);
    setRepoTree([]);
    
    try {
      const treeData = await fetchApi(`/github/repos/${repo.owner.login}/${repo.name}/tree/${repo.default_branch}`);
      if (treeData && treeData.tree) {
        setRepoTree(treeData.tree);
      }
    } catch (error) {
      console.error("Error fetching repo tree", error);
    } finally {
      setLoadingTree(false);
    }
  };

  const handleFileSelect = async (file) => {
    if (file.type !== 'blob') return;
    
    setSelectedFile(file);
    setLoadingFile(true);
    setFileContent(null);
    setReviewResult(null);
    
    try {
      const data = await fetchApi(
        `/github/repos/${selectedRepo.owner.login}/${selectedRepo.name}/contents?path=${encodeURIComponent(file.path)}&branch=${selectedRepo.default_branch}`
      );
      if (data && data.content) {
        const decodedContent = atob(data.content);
        setFileContent(decodedContent);
      } else {
        setFileContent("Could not read file contents.");
      }
    } catch (error) {
      console.error("Error fetching file content", error);
      setFileContent("Error loading file content.");
    } finally {
      setLoadingFile(false);
    }
  };

  const handleReviewCode = async () => {
    if (!fileContent) return;
    setReviewing(true);
    setReviewResult(null);
    try {
      const result = await fetchApi('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          codeSnippet: fileContent,
          fileName: selectedFile.path,
          repoName: selectedRepo.name,
        })
      });
      setReviewResult(result);
    } catch (error) {
      console.error("Review fail", error);
      alert(error.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleScanRepository = async () => {
    if (!selectedRepo) return;
    setScanningRepo(true);
    setRepoReport(null);
    try {
      const result = await fetchApi('/reviews/repository', {
        method: 'POST',
        body: JSON.stringify({
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          branch: selectedRepo.default_branch
        })
      });
      setRepoReport(result);
      setShowRepoReport(true);
    } catch (error) {
      console.error("Repo scan fail", error);
      alert(error.message);
    } finally {
      setScanningRepo(false);
    }
  };

  const fetchExistingRepoReport = async (repo) => {
    try {
      const data = await fetchApi(`/reviews/repository/${repo.owner.login}/${repo.name}`);
      if (data) {
        setRepoReport(data);
      } else {
        setRepoReport(null);
      }
    } catch (err) {
      console.error("Fetch existing report fail", err);
    }
  };

  useEffect(() => {
    if (selectedRepo) {
      fetchExistingRepoReport(selectedRepo);
    }
  }, [selectedRepo]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (editorRef.current && monaco && reviewResult?.feedback) {
      const newDecorations = [];
      const addDeco = (items, colorClass) => {
        if (!items) return;
        items.forEach(item => {
           if (item.line) {
             newDecorations.push({
               range: new monaco.Range(item.line, 1, item.line, 1),
               options: {
                 isWholeLine: true,
                 className: colorClass,
               }
             });
           }
        });
      };
      
      addDeco(reviewResult.feedback.bugs, 'deco-bug');
      addDeco(reviewResult.feedback.performance, 'deco-perf');
      addDeco(reviewResult.feedback.clean_code, 'deco-clean');
      
      const decoIds = editorRef.current.deltaDecorations(decorations, newDecorations);
      setDecorations(decoIds);
    } else if (editorRef.current && !reviewResult && decorations.length > 0) {
      editorRef.current.deltaDecorations(decorations, []);
      setDecorations([]);
    }
  }, [reviewResult, monaco]);

  const handleFeedbackClick = (line) => {
    if (!line || !editorRef.current) return;
    editorRef.current.revealLineInCenter(line);
    editorRef.current.setPosition({ lineNumber: line, column: 1 });
    editorRef.current.focus();
  };

  return (
    <div className="h-screen w-full bg-gray-950 text-gray-200 flex overflow-hidden font-sans">
      
      {/* Left Sidebar - Repositories */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col relative z-20 shadow-xl shadow-black/50 overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Sparkles className="text-indigo-500" size={24}/>
            <span>SageCoder</span>
          </div>
        </div>
        
        <div className="p-4 flex items-center gap-3">
          {user ? (
            <>
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-700" />
              <span className="text-sm font-medium">{user.username}</span>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse border border-gray-700"></div>
          )}
        </div>

        <div className="px-4 pb-2">
          <div className="relative text-gray-400 focus-within:text-indigo-400">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search repositories..." 
              className="w-full bg-gray-950/50 border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder-gray-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {loadingRepos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : (
            repos?.map(repo => (
              <button
                key={repo.id}
                onClick={() => handleRepoSelect(repo)}
                className={`w-full text-left p-3 flex items-center gap-3 rounded-xl transition-all duration-300
                  ${selectedRepo?.id === repo.id 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}
                `}
              >
                <FolderGit2 size={18} className={selectedRepo?.id === repo.id ? 'text-white' : 'text-gray-500'} />
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{repo.name}</p>
                  <p className={`text-xs truncate opacity-70 ${selectedRepo?.id === repo.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {repo.private ? 'Private' : 'Public'} • {repo.language || 'Unknown'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 mt-auto">
             <button onClick={() => { window.location.href = 'http://localhost:5000/api/auth/logout' }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full p-2 hover:bg-gray-800 rounded-lg">
                <LogOut size={16} /> Logout
             </button>
        </div>
      </div>

      {/* Middle Sidebar - File Explorer */}
      <div className={`w-80 shrink-0 bg-[#0d1117] border-r border-gray-800 flex flex-col transition-all duration-300 ${selectedRepo ? 'ml-0' : '-ml-80 absolute opacity-0'}`}>
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex flex-col gap-1">
             <span className="text-xs text-gray-500 font-medium normal-case">Repository</span>
             {selectedRepo?.name}
          </h2>
          <div className="mt-4 space-y-2">
            <button 
              onClick={handleScanRepository}
              disabled={scanningRepo}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
            >
              {scanningRepo ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              {scanningRepo ? 'Scanning Repo...' : 'Full Project Scan'}
            </button>
            {repoReport && !scanningRepo && (
               <button 
                onClick={() => setShowRepoReport(true)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-indigo-400 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 border border-gray-700"
               >
                 <Zap size={14} /> View Latest Mark: {repoReport.score}%
               </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar text-gray-300">
          {loadingTree ? (
             <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
               <Loader2 className="animate-spin text-indigo-500" size={24} />
               <span className="text-sm">Loading repository structure...</span>
             </div>
          ) : (
             <FileTree 
                treeData={repoTree} 
                onFileSelect={handleFileSelect} 
                selectedFile={selectedFile}
             />
          )}
        </div>
      </div>

      {/* Main Area - Code Viewer */}
      <div className="flex-1 bg-[#09090b] flex flex-col relative z-0 min-w-0">
        {selectedFile ? (
          <div className="flex flex-1 h-full w-full overflow-hidden">
            {/* Editor Area */}
            <div className={`flex flex-col flex-1 h-full min-w-0 transition-all duration-300 ${reviewResult ? 'border-r border-gray-800' : ''}`}>
              <div className="h-14 border-b border-gray-800 border-opacity-50 px-6 flex items-center bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10 justify-between shrink-0">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Code2 size={16} className="text-indigo-400" />
                  <span className="truncate">{selectedFile.path}</span>
                </div>
                <button 
                  onClick={handleReviewCode}
                  disabled={reviewing || loadingFile}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shrink-0">
                   {reviewing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                   {reviewing ? 'Analyzing...' : 'Review with AI'}
                </button>
              </div>
              
              <div className="flex-1 relative overflow-hidden">
                 {loadingFile ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]/50 backdrop-blur-sm z-20">
                        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                        <p className="text-gray-400">Loading {selectedFile.name}...</p>
                     </div>
                 ) : (
                    <Editor
                      height="100%"
                      language={getLanguage(selectedFile.name)}
                      theme="vs-dark"
                      value={fileContent || ''}
                      onMount={handleEditorDidMount}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        padding: { top: 16 }
                      }}
                    />
                 )}
              </div>
            </div>
            
            {/* AI Review Pane */}
            {reviewResult && (
               <div className="w-1/3 min-w-[350px] shrink-0 h-full flex flex-col bg-[#0d1117] overflow-y-auto custom-scrollbar border-l border-gray-800 z-10">
                 <div className="p-6">
                   <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2 border-b border-gray-800 pb-4">
                     <Sparkles className="text-indigo-400" /> AI Code Review
                   </h3>
                   
                   <div className="space-y-6">
                     {/* Bugs Section */}
                     <div className="space-y-3">
                       <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 uppercase tracking-wide">
                         <Bug size={16} /> Potential Issues
                       </h4>
                       {reviewResult.feedback?.bugs?.length > 0 ? (
                         reviewResult.feedback.bugs.map((item, id) => (
                           <div 
                             key={id} 
                             onClick={() => handleFeedbackClick(item.line)}
                             className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-red-500/30 cursor-pointer rounded-lg p-4 transition-colors"
                           >
                             <div className="font-mono text-xs text-red-400 mb-2">Line {item.line}</div>
                             <p className="text-gray-300 text-sm mb-2">{item.issue}</p>
                             <div className="bg-gray-950 p-2 rounded text-xs text-gray-400 border border-gray-800 font-mono whitespace-pre-wrap">{item.suggestion}</div>
                           </div>
                         ))
                       ) : (
                         <div className="text-sm text-gray-500 italic bg-gray-900/50 p-3 rounded-lg flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> No bugs detected.</div>
                       )}
                     </div>

                     {/* Performance Section */}
                     <div className="space-y-3">
                       <h4 className="text-sm font-semibold text-yellow-500 flex items-center gap-2 uppercase tracking-wide">
                         <Zap size={16} /> Performance
                       </h4>
                       {reviewResult.feedback?.performance?.length > 0 ? (
                         reviewResult.feedback.performance.map((item, id) => (
                           <div 
                             key={id} 
                             onClick={() => handleFeedbackClick(item.line)}
                             className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-yellow-500/30 cursor-pointer rounded-lg p-4 transition-colors"
                           >
                             <div className="font-mono text-xs text-yellow-500 mb-2">Line {item.line}</div>
                             <p className="text-gray-300 text-sm mb-2">{item.issue}</p>
                             <div className="bg-gray-950 p-2 rounded text-xs text-gray-400 border border-gray-800 font-mono whitespace-pre-wrap">{item.suggestion}</div>
                           </div>
                         ))
                       ) : (
                         <div className="text-sm text-gray-500 italic bg-gray-900/50 p-3 rounded-lg flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Looks optimal.</div>
                       )}
                     </div>

                     {/* Clean Code Section */}
                     <div className="space-y-3">
                       <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
                         <CheckCircle2 size={16} /> Clean Code
                       </h4>
                       {reviewResult.feedback?.clean_code?.length > 0 ? (
                         reviewResult.feedback.clean_code.map((item, id) => (
                           <div 
                             key={id} 
                             onClick={() => handleFeedbackClick(item.line)}
                             className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-emerald-500/30 cursor-pointer rounded-lg p-4 transition-colors"
                           >
                             <div className="font-mono text-xs text-emerald-400 mb-2">Line {item.line}</div>
                             <p className="text-gray-300 text-sm mb-2">{item.issue}</p>
                             <div className="bg-gray-950 p-2 rounded text-xs text-gray-400 border border-gray-800 font-mono whitespace-pre-wrap">{item.suggestion}</div>
                           </div>
                         ))
                       ) : (
                         <div className="text-sm text-gray-500 italic bg-gray-900/50 p-3 rounded-lg flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> No improvements suggested.</div>
                       )}
                     </div>

                   </div>
                 </div>
               </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 select-none">
            {selectedRepo ? (
              <>
                 <div className="w-24 h-24 mb-6 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800 shadow-2xl">
                     <FolderGit2 size={40} className="text-gray-600" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a file to view</h3>
                 <p className="text-sm">Browse the repository tree to select a file for code review.</p>
              </>
            ) : (
              <>
                 <div className="w-24 h-24 mb-6 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800 shadow-2xl relative">
                     <GitBranch size={40} className="text-indigo-500/50" />
                     <Sparkles size={20} className="absolute -top-2 -right-2 text-indigo-400 animate-pulse" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-300 mb-2">Welcome to SageCoder</h3>
                 <p className="text-sm">Select a repository from the sidebar to get started.</p>
              </>
            )}
          </div>
        )}
      </div>

      {showRepoReport && (
        <RepoHealthReport 
          report={repoReport} 
          onClose={() => setShowRepoReport(false)} 
        />
      )}

    </div>
  );
};

export default Dashboard;
