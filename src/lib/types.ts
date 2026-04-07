export type TemplateId =
  | "quote-card"
  | "kinetic-text"
  | "gradient-fadein"
  | "minimal-zen"
  | "story-slides";

export type TextSuggestion = {
  label: string;
  displayText: string;
  narrationScript: string;
};

export type BgmPreset = {
  id: string;
  name: string;
  description: string;
  url: string; // publicフォルダ内のパス
};

export type VideoState = {
  // ===== Step1: 音声アップロード =====
  audioFile: string | null;
  audioFileName: string | null;
  isTranscribing: boolean;
  transcript: string | null;

  // ===== Step2: テキスト選択・編集 =====
  isGenerating: boolean;
  textSuggestions: TextSuggestion[];
  selectedSuggestionIndex: number;
  titleText: string;
  titleFontSize: number; // タイトルフォントサイズ（px）
  titleFont: string; // タイトルフォント名
  quoteText: string;
  narrationScript: string;
  speakerName: string;
  contextLine: string;
  manualMode: boolean;

  // ===== Step3: 画像アップロード =====
  photos: string[];
  endingImage: string | null;
  endingText: string;
  endingTextSize: number; // エンディングメインテキストサイズ（px）
  endingSubText: string;
  endingSubTextSize: number; // エンディングサブテキストサイズ（px）

  // ===== Step4: テンプレート =====
  selectedTemplate: TemplateId;
  primaryColor: string;
  accentColor: string;
  backgroundImage: string | null;
  bgmFile: string | null;
  bgmPresetId: string | null; // 🆕 選択中のBGMプリセットID
  bgmVolume: number; // 🆕 BGM音量 0-1
  narrationVolume: number; // 🆕 ナレーション音量 0-1

  // ===== Step5: ナレーション録音＆書き出し =====
  narrationAudio: string | null;
  narrationFileName: string | null;
  narrationStartSec: number; // ナレーション開始タイミング（秒）
  isRecording: boolean;
  exportStatus: "idle" | "rendering" | "done" | "error";
  exportProgress: number;
  exportedBlobUrl: string | null;
};

export type TemplateProps = {
  titleText?: string;
  titleFontSize?: number;
  titleFont?: string;
  quoteText: string;
  speakerName: string;
  contextLine: string;
  backgroundImage: string | null;
  primaryColor: string;
  accentColor: string;
  photos?: string[];
  endingImage?: string | null;
  endingText?: string;
  endingTextSize?: number;
  endingSubText?: string;
  endingSubTextSize?: number;
  bgmFile?: string | null;
  narrationAudio?: string | null;
  bgmVolume?: number;
  narrationVolume?: number;
  narrationStartSec?: number;
};

export type TemplateMetadata = {
  id: TemplateId;
  name: string;
  description: string;
  durationInFrames: number;
  fps: number;
  defaultPrimaryColor: string;
  defaultAccentColor: string;
};
