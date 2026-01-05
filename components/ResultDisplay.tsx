
import React from 'react';
import { GeneratedImageResult } from '../types';

interface ResultDisplayProps {
  result: GeneratedImageResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `nice-ai-output-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="relative rounded-[32px] overflow-hidden border border-indigo-100 bg-white shadow-2xl shadow-indigo-100/30 group">
        <div className="aspect-w-16 aspect-h-9 min-h-[300px] flex items-center justify-center bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          <img
            src={result.imageUrl}
            alt="Generated Result"
            className="w-full h-auto object-contain max-h-[70vh] transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
        
        {/* Floating Download Button */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <button
            onClick={handleDownload}
            className="flex items-center gap-3 px-6 py-3 bg-gray-900/90 backdrop-blur text-white font-black text-xs rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            下载 4K 原图
          </button>
        </div>

        {/* Info Badge */}
        <div className="absolute top-6 left-6 flex gap-2">
           <div className="px-4 py-2 bg-white/90 backdrop-blur border border-gray-100 rounded-xl text-[10px] font-black text-gray-900 uppercase tracking-widest shadow-sm">
             4K 极致画质
           </div>
           <div className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100">
             处理成功
           </div>
        </div>
      </div>
      
      <div className="mt-4 p-5 bg-gray-50/80 rounded-[24px] border border-gray-100 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
           <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-black">AI 创作参数</p>
        </div>
        <p className="text-sm text-gray-700 italic font-medium leading-relaxed">“{result.promptUsed}”</p>
      </div>
    </div>
  );
};

export default ResultDisplay;
