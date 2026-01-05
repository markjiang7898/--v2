
import React, { useCallback, useState, useEffect } from 'react';
import ImageCropper from './ImageCropper';
import WatermarkEditor from './WatermarkEditor';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  selectedImage: File | null;
  isWatermarkMode?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, selectedImage, isWatermarkMode }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isWatermarkEditing, setIsWatermarkEditing] = useState(false);

  useEffect(() => {
    if (selectedImage) {
      const objectUrl = URL.createObjectURL(selectedImage);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [selectedImage]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请上传有效的图片文件');
        return;
      }
      onImageSelected(file);
    }
  }, [onImageSelected]);

  const handleCropComplete = (croppedBlob: Blob) => {
    const fileName = selectedImage ? `cropped-${selectedImage.name}` : 'cropped-image.jpg';
    const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' });
    onImageSelected(croppedFile);
    setIsCropping(false);
  };

  const handleWatermarkSave = (markedImageBase64: string) => {
    // 将 Base64 转换为 File
    fetch(markedImageBase64)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "marked-watermark.png", { type: "image/png" });
        onImageSelected(file);
        setIsWatermarkEditing(false);
      });
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">源图片</label>
      </div>
      
      {!selectedImage ? (
         <div className="relative border-2 border-dashed border-gray-100 rounded-[32px] p-12 transition-all hover:border-indigo-400 bg-white hover:bg-indigo-50/10 text-center cursor-pointer group shadow-sm">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors text-gray-400">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div className="text-sm font-bold text-gray-900 leading-tight">
              点击上传图片 <br/>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1 inline-block">Support PNG, JPG, WEBP</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative group rounded-[32px] overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
          <div className="relative min-h-[320px] max-h-[480px] flex items-center justify-center">
             {preview && (
               <img src={preview} alt="Selected source" className="max-h-[480px] object-contain w-full" />
             )}
          </div>
          
          {/* Action Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            {isWatermarkMode ? (
              <button
                onClick={() => setIsWatermarkEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl hover:bg-indigo-700 shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                开始标记水印
              </button>
            ) : (
              <button
                onClick={() => setIsCropping(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-bold text-xs rounded-2xl hover:bg-gray-50 shadow-xl border border-gray-100 transition-all transform hover:-translate-y-0.5"
              >
                裁剪与缩放
              </button>
            )}
            <button 
              onClick={() => {
                onImageSelected(null as any); 
                setPreview(null);
              }}
              className="w-10 h-10 bg-white text-gray-400 hover:text-red-500 rounded-2xl flex items-center justify-center shadow-xl border border-gray-100 transition-colors"
              title="移除图片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Prompt Overlay for Watermark Mode */}
          {isWatermarkMode && !isWatermarkEditing && (
             <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-xs font-bold flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                   点击右上方“开始标记”进行涂抹，AI 将移除标记区域
                </p>
             </div>
          )}
        </div>
      )}

      {/* Advanced Watermark Editor Modal */}
      {isWatermarkEditing && preview && (
        <WatermarkEditor
          imageSrc={preview}
          onCancel={() => setIsWatermarkEditing(false)}
          onSave={handleWatermarkSave}
        />
      )}

      {/* Crop Modal */}
      {isCropping && preview && (
        <ImageCropper 
          imageSrc={preview} 
          onCancel={() => setIsCropping(false)}
          handleSave={handleCropComplete}
        />
      )}
    </div>
  );
};

export default ImageUpload;
