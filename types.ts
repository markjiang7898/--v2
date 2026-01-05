
export enum ToolType {
  COLORIZE = 'COLORIZE',
  CARTOON = 'CARTOON',
  TEXT_TO_IMAGE = 'TEXT_TO_IMAGE',
  REMOVE_WATERMARK = 'REMOVE_WATERMARK',
  ENHANCE_HD = 'ENHANCE_HD'
}

export interface GeneratedImageResult {
  imageUrl: string;
  promptUsed: string;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  result: GeneratedImageResult | null;
}
