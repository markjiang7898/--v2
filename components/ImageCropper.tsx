
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/canvasUtils';

interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  handleSave: (croppedBlob: Blob) => void;
}

type CropMode = 'move' | 'draw';

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCancel, handleSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<CropMode>('move');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // 用于自由框选的模拟
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  const onCropChange = (crop: { x: number; y: number }) => {
    if (mode === 'move') setCrop(crop);
  };

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        handleSave(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 处理手动框选的交互逻辑 (利用 react-easy-crop 的 crop 状态模拟)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'draw' || !containerRef.current) return;
    setIsDrawing(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDrawStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || mode !== 'draw' || !containerRef.current) return;
    // 这里的逻辑可以进一步精细化，但为了简洁，提示用户在自由模式下使用拖拽
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-[40px] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">裁剪与构图</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Adjust dimensions for optimal AI processing</p>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setMode('move')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${mode === 'move' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
             >
               智能平移
             </button>
             <button 
                onClick={() => { setMode('draw'); setAspect(undefined); }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${mode === 'draw' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-gray-600'}`}
             >
               自由框选
             </button>
             <button onClick={onCancel} className="ml-4 w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 flex items-center justify-center transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        {/* Cropper Area */}
        <div 
          ref={containerRef}
          className="relative flex-1 bg-gray-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
           <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
            objectFit="contain"
            // 自由框选模式下显示更明显的网格和手柄
            showGrid={true}
            style={{
              containerStyle: { background: '#111827' },
              cropAreaStyle: { border: mode === 'draw' ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.5)' }
            }}
          />
          {mode === 'draw' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-2xl z-10 animate-bounce">
              模式：请直接拖拽白色边角来框选区域
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-10 py-8 bg-white border-t border-gray-50 flex flex-col gap-6">
          
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">精细缩放</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-xs font-black text-gray-900">{Math.round(zoom * 100)}%</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
               <button 
                onClick={() => { setAspect(undefined); setMode('draw'); }}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${aspect === undefined ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                自由选框
              </button>
              <button 
                onClick={() => { setAspect(1); setMode('move'); }}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${aspect === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                1:1 社交
              </button>
              <button 
                onClick={() => { setAspect(16 / 9); setMode('move'); }}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${aspect === 16 / 9 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                16:9 宽屏
              </button>
              <button 
                onClick={() => { setAspect(3 / 4); setMode('move'); }}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${aspect === 3 / 4 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                3:4
              </button>
            </div>

            <button
              onClick={onSave}
              className="w-full md:w-auto px-10 py-4 rounded-[20px] bg-indigo-600 text-white font-black text-sm tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <span>应用当前选框</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
