"use client";

import { useReducer } from "react";
import type { VideoState, TemplateId, TextSuggestion } from "@/lib/types";

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
  | { type: "RESET" };

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
    default:
      return state;
  }
}

export function useVideoState() {
  return useReducer(reducer, initialState);
}
