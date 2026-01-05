
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface WatermarkEditorProps {
  imageSrc: string;
  onCancel: () => void;
  onSave: (markedImageBase64: string) => void;
}

type ToolMode = 'brush' | 'rect';

interface Stroke {
  type: 'brush';
  points: { x: number; y: number }[];
  size: number;
}

interface Rect {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

type Marking = Stroke | Rect;

const WatermarkEditor: React.FC<WatermarkEditorProps> = ({ imageSrc, onCancel, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<ToolMode>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [markings, setMarkings] = useState<Marking[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentMarking, setCurrentMarking] = useState<Marking | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // 初始化图片
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
      // 初始缩放以适应屏幕
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const s = Math.min((width - 40) / img.width, (height - 100) / img.height, 1);
        setScale(s);
        setOffset({
          x: (width - img.width * s) / 2,
          y: (height - img.height * s) / 2
        });
      }
    };
  }, [imageSrc]);

  // 核心渲染逻辑
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布并设置尺寸
    canvas.width = containerRef.current?.clientWidth || 800;
    canvas.height = containerRef.current?.clientHeight || 600;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // 绘制原图
    ctx.drawImage(image, 0, 0);

    // 绘制所有已完成的标记
    const drawMarking = (m: Marking) => {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // red-500 with opacity
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      
      if (m.type === 'brush') {
        if (m.points.length < 2) return;
        ctx.lineWidth = m.size / scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        for (let i = 1; i < m.points.length; i++) {
          ctx.lineTo(m.points[i].x, m.points[i].y);
        }
        ctx.stroke();
      } else {
        ctx.fillRect(m.x, m.y, m.width, m.height);
      }
    };

    markings.forEach(drawMarking);
    if (currentMarking) drawMarking(currentMarking);

    ctx.restore();
  }, [image, markings, currentMarking, offset, scale]);

  useEffect(() => {
    render();
  }, [render]);

  // 坐标转换：屏幕坐标转图像原始坐标
  const getImgCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale
    };
  };

  // 绘图事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) return; // 中键或Alt+左键用于平移
    setIsDrawing(true);
    const coords = getImgCoords(e);
    
    if (mode === 'brush') {
      setCurrentMarking({ type: 'brush', points: [coords], size: brushSize });
    } else {
      setCurrentMarking({ type: 'rect', x: coords.x, y: coords.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentMarking) return;
    const coords = getImgCoords(e);

    if (currentMarking.type === 'brush') {
      setCurrentMarking({
        ...currentMarking,
        points: [...currentMarking.points, coords]
      });
    } else {
      setCurrentMarking({
        ...currentMarking,
        width: coords.x - currentMarking.x,
        height: coords.y - currentMarking.y
      });
    }
  };

  const handleMouseUp = () => {
    if (currentMarking) {
      setMarkings([...markings, currentMarking]);
    }
    setIsDrawing(false);
    setCurrentMarking(null);
  };

  // 缩放处理
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(scale * delta, 10));
    
    // 以鼠标位置为中心缩放
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // 保存并导出：将标记渲染到原图尺寸的画布上
  const handleApply = () => {
    if (!image) return;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = image.width;
    finalCanvas.height = image.height;
    const fctx = finalCanvas.getContext('2d');
    if (!fctx) return;

    // 绘制原图
    fctx.drawImage(image, 0, 0);

    // 绘制红色遮罩
    fctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    fctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    
    markings.forEach(m => {
      if (m.type === 'brush') {
        fctx.lineWidth = m.size;
        fctx.lineCap = 'round';
        fctx.lineJoin = 'round';
        fctx.beginPath();
        fctx.moveTo(m.points[0].x, m.points[0].y);
        m.points.forEach(p => fctx.lineTo(p.x, p.y));
        fctx.stroke();
      } else {
        fctx.fillRect(m.x, m.y, m.width, m.height);
      }
    });

    onSave(finalCanvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex flex-col animate-fade-in">
      {/* Top Toolbar */}
      <div className="h-20 bg-gray-900 border-b border-white/10 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setMode('brush')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'brush' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              画笔涂抹
            </button>
            <button 
              onClick={() => setMode('rect')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'rect' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              矩形框选
            </button>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">画笔粗细</span>
            <input 
              type="range" min="5" max="100" value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="text-xs font-bold text-white w-8">{brushSize}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">缩放比例</span>
            <span className="text-xs font-bold text-white">{Math.round(scale * 100)}%</span>
          </div>
          <button 
            onClick={() => { setMarkings([]); setScale(1); }}
            className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white transition-colors"
          >
            清空标记
          </button>
          <button 
            onClick={handleApply}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-xl transition-all active:scale-95"
          >
            完成标记
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="absolute inset-0 touch-none cursor-crosshair"
        />
        
        {/* Help Tip */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/5 backdrop-blur border border-white/10 rounded-2xl text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
          滚动滚轮缩放 • 拖拽标记区域 • 红色代表将要移除的部分
        </div>
      </div>
    </div>
  );
};

export default WatermarkEditor;
