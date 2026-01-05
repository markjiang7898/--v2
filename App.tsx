
import React, { useState, useEffect, useRef } from 'react';
import { ToolType, ProcessingState } from './types';
import Sidebar from './components/Sidebar';
import ImageUpload from './components/ImageUpload';
import ResultDisplay from './components/ResultDisplay';
import { generateImageContent } from './services/geminiService';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.ENHANCE_HD);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('isLoggedIn') === 'true');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showShareGuide, setShowShareGuide] = useState<boolean>(false);
  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localStorage.getItem('userPoints');
    return saved ? parseInt(saved) : 0;
  });
  const [progress, setProgress] = useState<number>(0);
  const [customRechargeAmount, setCustomRechargeAmount] = useState<string>('10');
  
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const progressIntervalRef = useRef<number | null>(null);

  // 持久化存储
  useEffect(() => {
    localStorage.setItem('userPoints', userPoints.toString());
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
  }, [userPoints, isLoggedIn]);

  // 模拟登录后赠送点数
  useEffect(() => {
    if (isLoggedIn && userPoints === 0 && !localStorage.getItem('hasInitialPoints')) {
      setUserPoints(100); 
      localStorage.setItem('hasInitialPoints', 'true');
    }
  }, [isLoggedIn, userPoints]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    setSourceImage(null);
    setTextPrompt('');
    setProcessingState({ isLoading: false, error: null, result: null });
    setProgress(0);
  };

  const startProgress = () => {
    setProgress(0);
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    
    progressIntervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev < 40) return prev + Math.random() * 8;
        if (prev < 75) return prev + Math.random() * 3;
        if (prev < 95) return prev + 0.5;
        return prev;
      });
    }, 500);
  };

  const stopProgress = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setProgress(100);
  };

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const cost = activeTool === ToolType.TEXT_TO_IMAGE ? 5 : 2;
    if (userPoints < cost) {
      setProcessingState({ ...processingState, error: `余额不足，本次操作需消耗 ${cost} 点数，请先充值。` });
      setShowRechargeModal(true);
      return;
    }

    if (activeTool !== ToolType.TEXT_TO_IMAGE && !sourceImage) {
      setProcessingState({ ...processingState, error: "请上传需要处理的图片" });
      return;
    }

    setProcessingState({ isLoading: true, error: null, result: null });
    startProgress();

    try {
      const generatedImageBase64 = await generateImageContent(activeTool, sourceImage, textPrompt);
      
      setUserPoints(prev => prev - cost);
      stopProgress();

      setProcessingState({
        isLoading: false,
        error: null,
        result: {
          imageUrl: generatedImageBase64,
          promptUsed: activeTool === ToolType.TEXT_TO_IMAGE ? textPrompt : `已完成「${getToolTitle()}」，消耗 ${cost} 点`
        }
      });
    } catch (err: any) {
      stopProgress();
      setProcessingState({
        isLoading: false,
        error: "当前排队人数较多或内容违规，请重试或更换图片",
        result: null
      });
    }
  };

  const getToolTitle = () => {
    switch (activeTool) {
      case ToolType.ENHANCE_HD: return "4K 超清增强";
      case ToolType.REMOVE_WATERMARK: return "局部去水印";
      case ToolType.COLORIZE: return "AI 智能上色";
      case ToolType.CARTOON: return "转动漫风格";
      case ToolType.TEXT_TO_IMAGE: return "文字绘图";
      default: return "图像工作台";
    }
  };

  const handleCopyInviteLink = () => {
    const inviteCode = Math.random().toString(36).substring(7).toUpperCase();
    const link = `${window.location.origin}/invite?code=${inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("邀请链接已复制！发送给好友，成功注册后双方各得 100 点数。");
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white select-none">
      <Sidebar 
        activeTool={activeTool} 
        onSelectTool={handleToolChange} 
        userPoints={userPoints}
        onOpenRecharge={() => setShowRechargeModal(true)}
        onOpenInvite={() => setShowInviteModal(true)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-20 md:pb-0">
        <header className="flex-shrink-0 px-8 py-6 flex items-center justify-between z-10 bg-white/50 backdrop-blur-sm border-b border-gray-50 md:border-none">
          <div className="flex items-center gap-4">
            <div className="md:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">N</div>
            <div>
               <h2 className="text-xl font-black text-gray-900 tracking-tight">{getToolTitle()}</h2>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v2.5 Engine Ready</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {isLoggedIn && (
               <div 
                  onClick={() => setShowRechargeModal(true)}
                  className="flex items-center gap-2 bg-amber-50 px-3 md:px-4 py-2 rounded-2xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
               >
                  <span className="text-sm font-black text-amber-700">{userPoints}</span>
                  <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest hidden sm:inline">P</span>
                  <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 text-[10px] font-bold">+</div>
               </div>
            )}
            
            {isLoggedIn ? (
              <div className="flex items-center gap-2 md:gap-3 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${localStorage.getItem('userSeed') || 'seed'}`} className="w-7 h-7 rounded-full border-2 border-white shadow-sm" alt="User" />
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-gray-900 leading-none">Pro_Member</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-4 md:px-6 py-2 bg-gray-900 text-white text-xs md:text-sm font-bold rounded-2xl hover:bg-indigo-600 shadow-xl transition-all"
              >
                登录
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6">
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            
            {/* 1. 进度条 */}
            {processingState.isLoading && (
              <section className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-black text-indigo-900">AI 正在魔法渲染中...</span>
                  <span className="text-xs font-black text-indigo-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-indigo-100 p-0.5">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out shadow-lg" style={{ width: `${progress}%` }}></div>
                </div>
              </section>
            )}

            {/* 2. 结果显示 */}
            {processingState.result && (
              <ResultDisplay result={processingState.result} />
            )}

            {processingState.error && (
              <div className="p-6 bg-red-50 text-red-700 text-sm font-bold rounded-[24px] border border-red-100 animate-shake">
                ⚠️ {processingState.error}
              </div>
            )}

            {/* 3. 输入区 */}
            <section className="bg-gray-50/50 p-6 md:p-8 rounded-[32px] border border-gray-100 shadow-sm">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className={`${activeTool === ToolType.TEXT_TO_IMAGE ? 'hidden' : 'block'}`}>
                    <ImageUpload 
                      onImageSelected={setSourceImage} 
                      selectedImage={sourceImage} 
                      isWatermarkMode={activeTool === ToolType.REMOVE_WATERMARK}
                    />
                 </div>

                 <div className={`${activeTool === ToolType.TEXT_TO_IMAGE ? 'md:col-span-2' : ''} flex flex-col justify-center space-y-6`}>
                    {activeTool === ToolType.TEXT_TO_IMAGE && (
                       <textarea
                          className="w-full border-none bg-white rounded-3xl shadow-sm focus:ring-2 focus:ring-indigo-100 p-6 h-40 resize-none text-base"
                          placeholder="描述你想要生成的画面，如：极简风格的中国山水画..."
                          value={textPrompt}
                          onChange={(e) => setTextPrompt(e.target.value)}
                       />
                    )}

                    <div className="bg-white p-5 rounded-[24px] border border-gray-100">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">消耗提示</h4>
                       <p className="text-sm text-gray-600 font-medium">
                         本次操作将消耗 <span className="text-indigo-600 font-bold">{activeTool === ToolType.TEXT_TO_IMAGE ? 5 : 2}</span> 点数。
                       </p>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={processingState.isLoading}
                      className={`w-full py-5 rounded-[24px] text-white font-black text-sm shadow-2xl transition-all active:scale-95
                        ${processingState.isLoading ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                    >
                      {processingState.isLoading ? '处理中...' : '提交处理'}
                    </button>
                 </div>
               </div>
            </section>
          </div>
        </div>
      </main>

      {/* 微信引导遮罩 */}
      {showShareGuide && (
        <div 
          onClick={() => setShowShareGuide(false)}
          className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-start pt-10 px-8 text-white animate-fade-in"
        >
          <div className="w-full flex justify-end mb-10">
            <svg className="w-20 h-20 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </div>
          <h3 className="text-2xl font-black mb-4">点击右上角分享</h3>
          <p className="text-center text-white/60 font-medium">通过微信菜单分享给好友或朋友圈<br/>好友注册后你将自动获得 100 点数奖励！</p>
        </div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-8 right-8 text-gray-400">✕</button>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-black">欢迎回来</h3>
              <p className="text-sm text-gray-400 mt-2 font-medium">注册送 <span className="text-indigo-600">100 点数</span></p>
            </div>
            <button onClick={() => { setIsLoggedIn(true); setShowLoginModal(false); localStorage.setItem('userSeed', Math.random().toString()); }} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl">极速进入</button>
          </div>
        </div>
      )}

      {/* 邀请弹窗 */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-8 md:p-10 relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-8 right-8 text-gray-400">✕</button>
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">🧧</div>
              <h3 className="text-2xl font-black">邀请奖励机制</h3>
              <p className="text-sm text-gray-400 mt-2">好友通过你的链接注册，双方均得 100 点</p>
            </div>
            <div className="space-y-4">
              <button onClick={handleCopyInviteLink} className="w-full py-4 bg-indigo-50 text-indigo-600 font-bold rounded-2xl border border-indigo-100">复制专属链接</button>
              <button onClick={() => { setShowInviteModal(false); setShowShareGuide(true); }} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl flex items-center justify-center gap-2">
                 <span>呼起微信分享</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 充值弹窗逻辑已在上一版完善，此处保持简洁，增加自定义金额限制 */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-8 md:p-10 my-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black">充值商城</h3>
              <button onClick={() => setShowRechargeModal(false)} className="text-gray-400">✕</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[10, 50, 100].map(p => (
                <div key={p} onClick={() => alert('支付接口申请中...')} className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 hover:border-indigo-500 cursor-pointer text-center group transition-all">
                  <p className="text-3xl font-black group-hover:text-indigo-600">{p * 10}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">点数</p>
                  <p className="text-lg font-black text-indigo-600 mt-6">¥ {p}</p>
                </div>
              ))}
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100">
               <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-indigo-400 uppercase mb-2 block">自定义金额 (1元起)</label>
                    <input 
                       type="number" 
                       min="1"
                       value={customRechargeAmount} 
                       onChange={(e) => setCustomRechargeAmount(e.target.value)} 
                       className="w-full px-6 py-4 rounded-2xl border-none font-black text-xl"
                    />
                  </div>
                  <button className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl self-end shadow-xl">立即支付</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
