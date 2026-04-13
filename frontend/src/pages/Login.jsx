import React from 'react';
import { motion } from 'framer-motion';
import { Github, Code2, Sparkles, Terminal } from 'lucide-react';

const Login = () => {
  const handleGithubLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
            <Code2 className="w-12 h-12 text-purple-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          SageCoder
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          AI-powered Code Review & Optimization Assistant
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-gray-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-800">
          <div className="space-y-6">
            
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Get instant feedback on your PRs</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <Terminal className="w-5 h-5 text-blue-400" />
              <span>Catch bugs before they reach production</span>
            </div>

            <div className="mt-8">
              <button
                onClick={handleGithubLogin}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 focus:ring-offset-gray-950 transition-all duration-200 group"
              >
                <Github className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                Continue with GitHub
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
