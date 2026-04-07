"use client";

import { useReducer, useEffect, useCallback } from "react";
import type { VideoState, TemplateId, TextSuggestion } from "@/lib/types";

const STORAGE_KEY = "rinri-video-state";
const TEMPLATE_KEY = "rinri-video-template";

const initialState: VideoState = {
  // Step1
  audioFile: null,
  audioFileName: null,
  isTranscribing: false,
  transcript: null,

  // Step2
  isGenerating: false,
  textSuggestions: [],
  selectedSuggestionIndex: -1,
  titleText: "",
  titleFontSize: 52,
  titleFont: "Noto Sans JP",
  quoteText: "",
  narrationScript: "",
  speakerName: "",
  contextLine: "",
  manualMode: false,

  // Step3
  photos: [],
  endingImage: null,
  endingText: "",
  endingTextSize: 56,
  endingSubText: "",
  endingSubTextSize: 36,

  // Step4
  selectedTemplate: "story-slides",
  primaryColor: "#1e3a5f",
  accentColor: "#e8b04a",
  backgroundImage: null,
  bgmFile: null,
  bgmPresetId: null,
  bgmVolume: 0.25,
  narrationVolume: 1.0,

  // Step5
  narrationAudio: null,
  narrationFileName: null,
  narrationStartSec: 2,
  isRecording: false,
  exportStatus: "idle",
  exportProgress: 0,
  exportedBlobUrl: null,
};

// localStorage から保存可能なフィールド（大きなbase64データは除外してサイズ節約）
type SaveableState = Omit<VideoState,
  "audioFile" | "isTranscribing" | "isGenerating" | "isRecording" |
  "exportStatus" | "exportProgress" | "exportedBlobUrl"
>;

function getSaveableState(state: VideoState): SaveableState {
  const { audioFile: _a, isTranscribing: _b, isGenerating: _c, isRecording: _d,
    exportStatus: _e, exportProgress: _f, exportedBlobUrl: _g, ...saveable } = state;
  return saveable;
}

// テンプレートとして保存するフィールド（テキスト・設定のみ）
type TemplateData = {
  titleText: string;
  titleFontSize: number;
  titleFont: string;
  speakerName: string;
  contextLine: string;
  endingImage: string | null; // エンディング画像も保存
  endingText: string;
  endingTextSize: number;
  endingSubText: string;
  endingSubTextSize: number;
  selectedTemplate: TemplateId;
  primaryColor: string;
  accentColor: string;
  bgmPresetId: string | null;
  bgmVolume: number;
  narrationVolume: number;
  narrationStartSec: number;
};

function getTemplateData(state: VideoState): TemplateData {
  return {
    titleText: state.titleText,
    titleFontSize: state.titleFontSize,
    titleFont: state.titleFont,
    speakerName: state.speakerName,
    contextLine: state.contextLine,
    endingImage: state.endingImage,
    endingText: state.endingText,
    endingTextSize: state.endingTextSize,
    endingSubText: state.endingSubText,
    endingSubTextSize: state.endingSubTextSize,
    selectedTemplate: state.selectedTemplate,
    primaryColor: state.primaryColor,
    accentColor: state.accentColor,
    bgmPresetId: state.bgmPresetId,
    bgmVolume: state.bgmVolume,
    narrationVolume: state.narrationVolume,
    narrationStartSec: state.narrationStartSec,
  };
}

export type Action =
  // Step1
  | { type: "SET_AUDIO_FILE"; payload: { data: string; name: string } }
  | { type: "CLEAR_AUDIO" }
  | { type: "SET_TRANSCRIBING"; payload: boolean }
  | { type: "SET_TRANSCRIPT"; payload: string }
  // Step2
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_TEXT_SUGGESTIONS"; payload: TextSuggestion[] }
  | { type: "SELECT_SUGGESTION"; payload: number }
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_TITLE_FONT_SIZE"; payload: number }
  | { type: "SET_TITLE_FONT"; payload: string }
  | { type: "SET_QUOTE"; payload: string }
  | { type: "SET_NARRATION_SCRIPT"; payload: string }
  | { type: "SET_SPEAKER"; payload: string }
  | { type: "SET_CONTEXT"; payload: string }
  | { type: "SET_MANUAL_MODE"; payload: boolean }
  // Step3
  | { type: "ADD_PHOTO"; payload: string }
  | { type: "REMOVE_PHOTO"; payload: number }
  | { type: "REORDER_PHOTOS"; payload: string[] }
  | { type: "SET_ENDING_IMAGE"; payload: string | null }
  | { type: "SET_ENDING_TEXT"; payload: string }
  | { type: "SET_ENDING_TEXT_SIZE"; payload: number }
  | { type: "SET_ENDING_SUB_TEXT"; payload: string }
  | { type: "SET_ENDING_SUB_TEXT_SIZE"; payload: number }
  // Step4
  | { type: "SET_TEMPLATE"; payload: TemplateId }
  | { type: "SET_PRIMARY_COLOR"; payload: string }
  | { type: "SET_ACCENT_COLOR"; payload: string }
  | { type: "SET_BG_IMAGE"; payload: string | null }
  | { type: "SET_BGM"; payload: string | null }
  | { type: "SET_BGM_PRESET"; payload: string | null }
  | { type: "SET_BGM_VOLUME"; payload: number }
  | { type: "SET_NARRATION_VOLUME"; payload: number }
  // Step5
  | { type: "SET_NARRATION_AUDIO"; payload: { data: string; name: string } | null }
  | { type: "SET_NARRATION_START_SEC"; payload: number }
  | { type: "SET_RECORDING"; payload: boolean }
  | { type: "SET_EXPORT_STATUS"; payload: VideoState["exportStatus"] }
  | { type: "SET_EXPORT_PROGRESS"; payload: number }
  | { type: "SET_EXPORTED_URL"; payload: string | null }
  // Global
  | { type: "RESET" }
  | { type: "LOAD_SAVED"; payload: Partial<VideoState> }
  | { type: "LOAD_TEMPLATE"; payload: TemplateData };

function reducer(state: VideoState, action: Action): VideoState {
  switch (action.type) {
    case "SET_AUDIO_FILE":
      return { ...state, audioFile: action.payload.data, audioFileName: action.payload.name };
    case "CLEAR_AUDIO":
      return { ...state, audioFile: null, audioFileName: null, transcript: null, textSuggestions: [], selectedSuggestionIndex: -1 };
    case "SET_TRANSCRIBING":
      return { ...state, isTranscribing: action.payload };
    case "SET_TRANSCRIPT":
      return { ...state, transcript: action.payload };

    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };
    case "SET_TEXT_SUGGESTIONS":
      return { ...state, textSuggestions: action.payload };
    case "SELECT_SUGGESTION": {
      const s = state.textSuggestions[action.payload];
      if (!s) return { ...state, selectedSuggestionIndex: action.payload };
      return { ...state, selectedSuggestionIndex: action.payload, quoteText: s.displayText, narrationScript: s.narrationScript };
    }
    case "SET_TITLE":
      return { ...state, titleText: action.payload };
    case "SET_TITLE_FONT_SIZE":
      return { ...state, titleFontSize: action.payload };
    case "SET_TITLE_FONT":
      return { ...state, titleFont: action.payload };
    case "SET_QUOTE":
      return { ...state, quoteText: action.payload };
    case "SET_NARRATION_SCRIPT":
      return { ...state, narrationScript: action.payload };
    case "SET_SPEAKER":
      return { ...state, speakerName: action.payload };
    case "SET_CONTEXT":
      return { ...state, contextLine: action.payload };
    case "SET_MANUAL_MODE":
      return { ...state, manualMode: action.payload };

    case "ADD_PHOTO":
      if (state.photos.length >= 3) return state;
      return { ...state, photos: [...state.photos, action.payload], backgroundImage: state.photos.length === 0 ? action.payload : state.backgroundImage };
    case "REMOVE_PHOTO": {
      const np = state.photos.filter((_, i) => i !== action.payload);
      return { ...state, photos: np, backgroundImage: np[0] ?? null };
    }
    case "REORDER_PHOTOS":
      return { ...state, photos: action.payload, backgroundImage: action.payload[0] ?? null };
    case "SET_ENDING_IMAGE":
      return { ...state, endingImage: action.payload };
    case "SET_ENDING_TEXT":
      return { ...state, endingText: action.payload };
    case "SET_ENDING_TEXT_SIZE":
      return { ...state, endingTextSize: action.payload };
    case "SET_ENDING_SUB_TEXT":
      return { ...state, endingSubText: action.payload };
    case "SET_ENDING_SUB_TEXT_SIZE":
      return { ...state, endingSubTextSize: action.payload };

    case "SET_TEMPLATE":
      return { ...state, selectedTemplate: action.payload };
    case "SET_PRIMARY_COLOR":
      return { ...state, primaryColor: action.payload };
    case "SET_ACCENT_COLOR":
      return { ...state, accentColor: action.payload };
    case "SET_BG_IMAGE":
      return { ...state, backgroundImage: action.payload };
    case "SET_BGM":
      return { ...state, bgmFile: action.payload };
    case "SET_BGM_PRESET":
      return { ...state, bgmPresetId: action.payload };
    case "SET_BGM_VOLUME":
      return { ...state, bgmVolume: action.payload };
    case "SET_NARRATION_VOLUME":
      return { ...state, narrationVolume: action.payload };

    case "SET_NARRATION_AUDIO":
      if (!action.payload) return { ...state, narrationAudio: null, narrationFileName: null };
      return { ...state, narrationAudio: action.payload.data, narrationFileName: action.payload.name };
    case "SET_NARRATION_START_SEC":
      return { ...state, narrationStartSec: action.payload };
    case "SET_RECORDING":
      return { ...state, isRecording: action.payload };
    case "SET_EXPORT_STATUS":
      return { ...state, exportStatus: action.payload };
    case "SET_EXPORT_PROGRESS":
      return { ...state, exportProgress: action.payload };
    case "SET_EXPORTED_URL":
      return { ...state, exportedBlobUrl: action.payload };

    case "RESET":
      return initialState;
    case "LOAD_SAVED":
      return { ...state, ...action.payload };
    case "LOAD_TEMPLATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function useVideoState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 起動時: localStorageから復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const step = parseInt(localStorage.getItem(STORAGE_KEY + "-step") || "0", 10);
        dispatch({ type: "LOAD_SAVED", payload: parsed });
        // stepも返す必要があるのでwindowイベントで通知
        window.dispatchEvent(new CustomEvent("restore-step", { detail: step }));
      }
    } catch { /* ignore */ }
  }, []);

  // 状態変更時: localStorageに自動保存（デバウンス）
  // モバイルではbase64画像をlocalStorageに保存しない（メモリ節約）
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saveable = getSaveableState(state);
        // localStorageのサイズ制限対策：画像データが大きすぎる場合は除外
        const dataStr = JSON.stringify(saveable);
        if (dataStr.length > 4_000_000) {
          // 4MB超えたら画像を除外して保存
          const lite = { ...saveable, photos: [], endingImage: null, backgroundImage: null, bgmFile: null, narrationAudio: null };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lite));
        } else {
          localStorage.setItem(STORAGE_KEY, dataStr);
        }
      } catch { /* quota exceeded etc */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  // テンプレート保存
  const saveTemplate = useCallback(() => {
    try {
      const tmpl = getTemplateData(state);
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(tmpl));
    } catch { /* ignore */ }
  }, [state]);

  // テンプレート読み込み
  const loadTemplate = useCallback(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_KEY);
      if (saved) {
        dispatch({ type: "LOAD_TEMPLATE", payload: JSON.parse(saved) });
        return true;
      }
    } catch { /* ignore */ }
    return false;
  }, []);

  // ステップ保存
  const saveStep = useCallback((step: number) => {
    try {
      localStorage.setItem(STORAGE_KEY + "-step", String(step));
    } catch { /* ignore */ }
  }, []);

  return [state, dispatch, { saveTemplate, loadTemplate, saveStep }] as const;
}
