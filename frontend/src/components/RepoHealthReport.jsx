import React from 'react';
import { Shield, Layout, Settings, Zap, ArrowRight, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

const RepoHealthReport = ({ report, onClose }) => {
  if (!report) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const categories = [
    { label: 'Architecture', value: report.categories?.architecture, icon: Layout, color: 'text-blue-400' },
    { label: 'Security', value: report.categories?.security, icon: Shield, color: 'text-indigo-400' },
    { label: 'Maintainability', value: report.categories?.maintainability, icon: Settings, color: 'text-purple-400' },
    { label: 'Performance', value: report.categories?.performance, icon: Zap, color: 'text-orange-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-full bg-gray-900 border-l border-gray-800 shadow-2xl overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              SageMark Report
            </h2>
            <p className="text-gray-400 text-sm">Comprehensive repository health analysis</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Main Score */}
          <div className="bg-gray-950 rounded-3xl p-8 border border-gray-800 flex items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
               <Shield size={160} />
            </div>
            
            <div className="relative z-10">
              <span className="text-sm font-semibold text-indigo-400 tracking-widest uppercase mb-2 block">Overall Health Score</span>
              <h3 className="text-6xl font-black text-white">
                {report.score}<span className="text-indigo-500 text-2xl">/100</span>
              </h3>
              <p className="mt-4 text-gray-400 max-w-xs">{report.summary}</p>
            </div>

            <div className="hidden md:flex flex-col items-center gap-2 relative z-10">
               <div className={`w-24 h-24 rounded-full border-4 border-gray-800 flex items-center justify-center relative`}>
                  <svg className="w-24 h-24 absolute -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * report.score) / 100}
                      className={`${getScoreColor(report.score)} transition-all duration-1000`}
                    />
                  </svg>
                  <span className={`text-xl font-bold ${getScoreColor(report.score)}`}>{report.score}%</span>
               </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <div key={i} className="bg-gray-950 border border-gray-800 p-4 rounded-2xl hover:border-indigo-500/30 transition-all">
                <cat.icon size={20} className={`${cat.color} mb-3`} />
                <div className="text-xs text-gray-500 font-medium uppercase mb-1">{cat.label}</div>
                <div className="text-xl font-bold text-white">{cat.value}%</div>
                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                   <div 
                    className={`h-full ${cat.color} bg-current`} 
                    style={{ width: `${cat.value}%` }}
                   />
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs tracking-wider">
                <CheckCircle2 size={16} /> Key Strengths
              </h4>
              <div className="space-y-3">
                {report.strengths?.map((s, i) => (
                  <div key={i} className="flex gap-3 text-sm text-gray-300">
                    <div className="mt-1 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-red-400 font-bold uppercase text-xs tracking-wider">
                <AlertTriangle size={16} /> Critical Issues
              </h4>
              <div className="space-y-3">
                {report.weaknesses?.map((w, i) => (
                  <div key={i} className="flex gap-3 text-sm text-gray-300">
                    <div className="mt-1 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
            <h4 className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider mb-4">
              <Lightbulb size={16} /> Next Steps & Recommendations
            </h4>
            <div className="space-y-4">
              {report.recommendations?.map((r, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{r}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RepoHealthReport;
