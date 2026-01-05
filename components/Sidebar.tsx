
import React from 'react';
import { ToolType } from '../types';

interface SidebarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  userPoints: number;
  onOpenRecharge: () => void;
  onOpenInvite: () => void;
}

const tools = [
  {
    id: ToolType.ENHANCE_HD,
    label: '4K 超清增强',
    description: '模糊修复与极清重构',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    )
  },
  {
    id: ToolType.REMOVE_WATERMARK,
    label: '局部去水印',
    description: '涂抹消除杂物',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
    )
  },
  {
    id: ToolType.COLORIZE,
    label: 'AI 智能上色',
    description: '黑白旧照焕发新生',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
    )
  },
  {
    id: ToolType.CARTOON,
    label: '转动漫风格',
    description: '唯美手绘艺术效果',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )
  },
  {
    id: ToolType.TEXT_TO_IMAGE,
    label: '文字绘图',
    description: '创意灵感瞬间呈现',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTool, onSelectTool, userPoints, onOpenRecharge, onOpenInvite }) => {
  return (
    <>
      {/* PC 侧边栏 */}
      <div className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-shrink-0 flex-col h-full z-20">
        <div className="p-8">
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-100">N</span>
            NICE 图像工作台
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeTool === tool.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${activeTool === tool.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                {tool.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm tracking-wide">{tool.label}</span>
                <span className={`text-[10px] font-medium ${activeTool === tool.id ? 'text-indigo-400' : 'text-gray-400'}`}>{tool.description}</span>
              </div>
            </button>
          ))}
          
          <div className="pt-6 pb-2">
            <button 
              onClick={onOpenInvite}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100 transition-all group"
            >
              <div className="p-2 bg-orange-500 text-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm">邀请好友</span>
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">立得 100 点数</span>
              </div>
            </button>
          </div>
        </nav>
        
        <div className="p-6">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-5 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
             <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-xs shadow-lg">V</div>
                <div>
                  <p className="text-xs font-black text-white">账户点数余额</p>
                  <p className="text-xl font-black text-amber-400">{userPoints}</p>
                </div>
             </div>
             <button 
                onClick={onOpenRecharge}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-indigo-950 text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 relative z-10"
              >
                立即充值点数
              </button>
          </div>
        </div>
      </div>

      {/* 移动端底部导航栏 (微信环境适配) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-2 py-3 flex justify-around items-center z-[100] safe-area-bottom">
        {tools.slice(0, 4).map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`flex flex-col items-center gap-1 min-w-[64px] transition-all ${activeTool === tool.id ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${activeTool === tool.id ? 'bg-indigo-600 text-white shadow-lg' : ''}`}>
              {tool.icon}
            </div>
            <span className="text-[10px] font-bold">{tool.label.split(' ')[1] || tool.label}</span>
          </button>
        ))}
        <button 
          onClick={onOpenInvite}
          className="flex flex-col items-center gap-1 text-orange-500"
        >
          <div className="p-2 bg-orange-500 text-white rounded-xl shadow-lg">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span className="text-[10px] font-bold">领奖励</span>
        </button>
      </div>
    </>
  );
};

export default Sidebar;
