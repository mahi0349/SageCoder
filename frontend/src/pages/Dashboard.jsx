import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import FileTree from '../components/FileTree';
import { Github, FolderGit2, Search, Loader2, Code2, Sparkles, LogOut } from 'lucide-react';

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

  useEffect(() => {
    // Fetch user and repos on mount
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
    if (file.type !== 'blob') return; // only fetch files
    
    setSelectedFile(file);
    setLoadingFile(true);
    setFileContent(null);
    
    try {
      const data = await fetchApi(
        `/github/repos/${selectedRepo.owner.login}/${selectedRepo.name}/contents?path=${encodeURIComponent(file.path)}&branch=${selectedRepo.default_branch}`
      );
      if (data && data.content) {
        // GitHub returns base64 encoded content
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

  return (
    <div className="h-screen w-full bg-gray-950 text-gray-200 flex overflow-hidden font-sans">
      
      {/* Left Sidebar - Repositories */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col relative z-20 shadow-xl shadow-black/50">
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
        <div className="p-4 border-t border-gray-800">
             <button onClick={() => { window.location.href = 'http://localhost:5000/api/auth/logout' }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full p-2 hover:bg-gray-800 rounded-lg">
                <LogOut size={16} /> Logout
             </button>
        </div>
      </div>

      {/* Middle Sidebar - File Explorer */}
      <div className={`w-80 bg-[#0d1117] border-r border-gray-800 flex flex-col transition-all duration-300 ${selectedRepo ? 'translate-x-0' : '-translate-x-full absolute opacity-0'}`}>
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex flex-col gap-1">
             <span className="text-xs text-gray-500 font-medium normal-case">Repository</span>
             {selectedRepo?.name}
          </h2>
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
      <div className="flex-1 bg-[#09090b] flex flex-col relative z-0 overflow-hidden">
        {selectedFile ? (
          <>
            <div className="h-14 border-b border-gray-800 border-opacity-50 px-6 flex items-center bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10 justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Code2 size={16} className="text-indigo-400" />
                <span>{selectedFile.path}</span>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
                 <Sparkles size={14} /> Review with AI
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-sm font-mono relative">
               {loadingFile ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]/50 backdrop-blur-sm z-20">
                      <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                      <p className="text-gray-400">Loading {selectedFile.name}...</p>
                   </div>
               ) : (
                  <pre className="text-gray-300 whitespace-pre-wrap highlight-code">
                    <code>{fileContent}</code>
                  </pre>
               )}
            </div>
          </>
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
                     <Github size={40} className="text-indigo-500/50" />
                     <Sparkles size={20} className="absolute -top-2 -right-2 text-indigo-400 animate-pulse" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-300 mb-2">Welcome to SageCoder</h3>
                 <p className="text-sm">Select a repository from the sidebar to get started.</p>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
