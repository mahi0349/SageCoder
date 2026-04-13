import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, File, ChevronRight, ChevronDown } from 'lucide-react';

const getFileIcon = (filename) => {
  if (!filename) return <File size={16} className="text-gray-400" />;
  const l_name = filename.toLowerCase();
  if (/\.(js|jsx|ts|tsx)$/.test(l_name)) return <FileCode size={16} className="text-blue-400" />;
  if (/\.(json)$/.test(l_name)) return <FileCode size={16} className="text-yellow-400" />;
  if (/\.(css|scss|less)$/.test(l_name)) return <FileCode size={16} className="text-pink-400" />;
  return <File size={16} className="text-gray-400" />;
};

const TreeNode = ({ node, level = 0, onFileSelect, selectedFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedFile?.path === node.path;

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (node.type === 'tree') {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer rounded-md text-sm transition-colors duration-200
          ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-gray-800 text-gray-300'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={toggleOpen}
      >
        {node.type === 'tree' ? (
          <div className="flex items-center gap-1">
            {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
            {isOpen ? <FolderOpen size={16} className="text-indigo-400" /> : <Folder size={16} className="text-indigo-400" />}
          </div>
        ) : (
          <div className="flex items-center gap-1 ml-4">
            {getFileIcon(node.name)}
          </div>
        )}
        <span className="truncate flex-1">{node.name}</span>
      </div>
      
      {node.type === 'tree' && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode 
              key={child.path} 
              node={child} 
              level={level + 1} 
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Build tree from flat github recursion
const buildTree = (nodes) => {
  const root = { children: [] };
  const map = { '': root };

  // First pass: create all tree nodes
  nodes.forEach(node => {
     // GitHub path e.g. "src/components/Button.jsx"
     const parts = node.path.split('/');
     const name = parts[parts.length - 1];
     const parentPath = parts.slice(0, -1).join('/');
     
     const newNode = { ...node, name, children: node.type === 'tree' ? [] : undefined };
     map[node.path] = newNode;
     
     if (!map[parentPath]) {
        // Just in case parent is missing from the list
        map[parentPath] = { children: [] };
     }
     map[parentPath].children.push(newNode);
  });
  
  // Sort children: folders first, then files alphabetically
  const sortChildren = (node) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'tree' ? -1 : 1;
      });
      node.children.forEach(sortChildren);
    }
  };
  
  sortChildren(root);
  return root.children;
};

const FileTree = ({ treeData, onFileSelect, selectedFile }) => {
  if (!treeData || treeData.length === 0) {
    return <div className="text-gray-500 text-sm p-4">No files found.</div>;
  }

  const structuredTree = buildTree(treeData);

  return (
    <div className="flex flex-col gap-0.5 mt-2">
      {structuredTree.map(node => (
        <TreeNode 
          key={node.path} 
          node={node} 
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      ))}
    </div>
  );
};

export default FileTree;
