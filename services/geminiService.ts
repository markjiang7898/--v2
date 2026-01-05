
import { GoogleGenAI } from "@google/genai";
import { ToolType } from "../types";

// 将文件转换为 Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

// 获取图像尺寸
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// 匹配最接近的比例
const getClosestAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;
  const supportedRatios = {
    "1:1": 1,
    "3:4": 3/4,
    "4:3": 4/3,
    "9:16": 9/16,
    "16:9": 16/9,
  };

  let closestRatio = "1:1";
  let minDiff = Infinity;

  for (const [key, value] of Object.entries(supportedRatios)) {
    const diff = Math.abs(ratio - value);
    if (diff < minDiff) {
      minDiff = diff;
      closestRatio = key;
    }
  }
  return closestRatio;
};

const getPromptForTool = (tool: ToolType, customPrompt?: string): string => {
  switch (tool) {
    case ToolType.COLORIZE:
      return "请为这张图像进行写实上色。要求颜色还原自然，符合常识。输出结果为 4K 高清图像。";
    case ToolType.CARTOON:
      return "Comprehensive Style Transfer: Transform the input photo into a professional high-quality Japanese Anime (2D Manga/Anime) illustration. Key Requirements: 1. Use clean, expressive line art; 2. Apply vibrant cell-shading with clear highlight and shadow boundaries; 3. Atmospheric lighting in the style of Makoto Shinkai or Ghibli; 4. Re-draw all textures as hand-painted anime background art. The final result must be a 4K masterpiece anime still, completely avoiding photorealistic textures.";
    case ToolType.REMOVE_WATERMARK:
      return "移除图像中红色区域或标记。智能填充背景。输出结果为 4K 高质量图像。";
    case ToolType.ENHANCE_HD:
      return "对该图像进行极致 4K 超清增强：1. 显著提升清晰度和对比度；2. 智能重构像素，修复因模糊带来的细节缺失；3. 修复划痕、噪点或老化折痕。最终输出极清、无损的高质量图像。";
    case ToolType.TEXT_TO_IMAGE:
      return `根据以下描述生成 4K 极清图像：${customPrompt || "极致创意设计"}`;
    default:
      return "以 4K 极清质量处理此图像。";
  }
};

export const generateImageContent = async (
  tool: ToolType,
  imageFile: File | null,
  textPrompt: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY 未配置，请关联付费密钥。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // 对于 4K 增强和特定风格，始终强制使用 Pro 级模型以保证风格化能力
  let modelName = 'gemini-2.5-flash-image';
  let config: any = undefined;

  // 动漫风格、增强、去水印均建议使用 3-pro 以获得最佳效果
  if (tool === ToolType.CARTOON || tool === ToolType.ENHANCE_HD || tool === ToolType.REMOVE_WATERMARK) {
    modelName = 'gemini-3-pro-image-preview';
    config = {
      imageConfig: {
        imageSize: '4K',
        aspectRatio: '1:1' // 默认值，后续如有需要可根据图像动态调整
      }
    };
  }

  const prompt = getPromptForTool(tool, textPrompt);
  const parts: any[] = [];

  if (imageFile && tool !== ToolType.TEXT_TO_IMAGE) {
    const base64Data = await fileToBase64(imageFile);
    parts.push({
      inlineData: {
        mimeType: imageFile.type,
        data: base64Data
      }
    });

    // 如果是带图操作，动态计算宽高比
    const { width, height } = await getImageDimensions(imageFile);
    if (config?.imageConfig) {
      config.imageConfig.aspectRatio = getClosestAspectRatio(width, height);
    } else {
      config = { imageConfig: { aspectRatio: getClosestAspectRatio(width, height) } };
    }
  }

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: parts }],
      config: config
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("响应中未包含图像数据。可能是由于图片内容触发了安全策略，请更换图片尝试。");

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
