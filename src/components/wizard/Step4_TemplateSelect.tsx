"use client";

import { useCallback, useRef, useState } from "react";
import { Player } from "@remotion/player";
import type { VideoState, TemplateId } from "@/lib/types";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { BGM_PRESETS, generateBgmAudio } from "@/lib/bgm-presets";
import { QuoteCard } from "@/components/video/templates/QuoteCard";
import { KineticText } from "@/components/video/templates/KineticText";
import { GradientFadeIn } from "@/components/video/templates/GradientFadeIn";
import { MinimalZen } from "@/components/video/templates/MinimalZen";
import { StorySlides } from "@/components/video/templates/StorySlides";
import type { Dispatch } from "react";
import type { Action } from "@/hooks/useVideoState";

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
};

function getTemplateComponent(id: TemplateId) {
  switch (id) {
    case "quote-card": return QuoteCard;
    case "kinetic-text": return KineticText;
    case "gradient-fadein": return GradientFadeIn;
    case "minimal-zen": return MinimalZen;
    case "story-slides": return StorySlides;
    default: return QuoteCard;
  }
}

export function Step4_TemplateSelect({ state, dispatch }: Props) {
  const bgmInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [loadingBgmId, setLoadingBgmId] = useState<string | null>(null);

  const currentTemplate = getTemplate(state.selectedTemplate);
  const TemplateComponent = getTemplateComponent(state.selectedTemplate);

  const handleBgmUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: "SET_BGM", payload: reader.result as string });
        dispatch({ type: "SET_BGM_PRESET", payload: null });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  // BGMプリセットのプレビュー再生
  const handlePreviewBgm = useCallback(async (presetId: string) => {
    // 同じものを再度押したら停止
    if (previewingId === presetId) {
      previewAudioRef.current?.pause();
      setPreviewingId(null);
      return;
    }

    setPreviewingId(presetId);
    setLoadingBgmId(presetId);

    try {
      const audioData = await generateBgmAudio(presetId);
      setLoadingBgmId(null);

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(audioData);
      audio.volume = 0.5;
      audio.onended = () => setPreviewingId(null);
      previewAudioRef.current = audio;
      audio.play();
    } catch {
      setLoadingBgmId(null);
      setPreviewingId(null);
    }
  }, [previewingId]);

  // BGMプリセットを選択・適用
  const handleSelectBgm = useCallback(async (presetId: string) => {
    setLoadingBgmId(presetId);
    try {
      const audioData = await generateBgmAudio(presetId);
      dispatch({ type: "SET_BGM", payload: audioData });
      dispatch({ type: "SET_BGM_PRESET", payload: presetId });
    } catch {
      alert("BGMの生成に失敗しました");
    }
    setLoadingBgmId(null);
  }, [dispatch]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* テンプレート一覧 */}
      <div>
        <h3 className="text-sm font-medium mb-3">テンプレートを選択</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => dispatch({ type: "SET_TEMPLATE", payload: t.id })}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                state.selectedTemplate === t.id
                  ? "border-amber-700 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className="w-full aspect-[9/16] rounded-lg mb-2"
                style={{
                  background: `linear-gradient(135deg, ${t.defaultPrimaryColor}, ${t.defaultPrimaryColor}99)`,
                }}
              />
              <p className="text-xs font-medium">{t.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* プレビュー＋設定 */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 flex justify-center">
          <div className="w-[270px] max-w-[calc(100vw-2rem)] aspect-[9/16] rounded-2xl overflow-hidden shadow-xl">
            <Player
              component={TemplateComponent}
              inputProps={{
                titleText: state.titleText,
                titleFontSize: state.titleFontSize,
                titleFont: state.titleFont,
                quoteText: state.quoteText || "ここに名言が表示されます",
                speakerName: state.speakerName,
                contextLine: state.contextLine,
                backgroundImage: state.backgroundImage,
                primaryColor: state.primaryColor,
                accentColor: state.accentColor,
                photos: state.photos,
                endingImage: state.endingImage,
                endingText: state.endingText,
                endingTextSize: state.endingTextSize,
                endingSubText: state.endingSubText,
                endingSubTextSize: state.endingSubTextSize,
                bgmFile: state.bgmFile,
                narrationAudio: state.narrationAudio,
                bgmVolume: state.bgmVolume,
                narrationVolume: state.narrationVolume,
                narrationStartSec: state.narrationStartSec,
              }}
              durationInFrames={currentTemplate?.durationInFrames ?? 900}
              fps={currentTemplate?.fps ?? 30}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%" }}
              controls
              autoPlay
              loop
            />
          </div>
        </div>

        {/* 設定パネル */}
        <div className="space-y-5 w-full md:w-72">
          {/* カラー設定 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">メインカラー</label>
              <div className="flex items-center gap-2">
                <input type="color" value={state.primaryColor}
                  onChange={(e) => dispatch({ type: "SET_PRIMARY_COLOR", payload: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer" />
                <span className="text-xs text-gray-400">{state.primaryColor}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">アクセント</label>
              <div className="flex items-center gap-2">
                <input type="color" value={state.accentColor}
                  onChange={(e) => dispatch({ type: "SET_ACCENT_COLOR", payload: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer" />
                <span className="text-xs text-gray-400">{state.accentColor}</span>
              </div>
            </div>
          </div>

          {/* BGMプリセット */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-3">🎵 BGMを選択</label>
            <div className="space-y-2">
              {BGM_PRESETS.map((preset) => (
                <div key={preset.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    state.bgmPresetId === preset.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* プレビューボタン */}
                  <button type="button"
                    onClick={() => handlePreviewBgm(preset.id)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    {loadingBgmId === preset.id ? (
                      <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    ) : previewingId === preset.id ? (
                      <span className="text-xs">⏸</span>
                    ) : (
                      <span className="text-xs">▶️</span>
                    )}
                  </button>

                  {/* 情報 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{preset.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{preset.description}</p>
                  </div>

                  {/* 選択ボタン */}
                  <button type="button"
                    onClick={() => handleSelectBgm(preset.id)}
                    className={`px-2 py-1 text-[10px] rounded-lg transition-colors flex-shrink-0 ${
                      state.bgmPresetId === preset.id
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-amber-100"
                    }`}
                  >
                    {state.bgmPresetId === preset.id ? "✓選択中" : "使用"}
                  </button>
                </div>
              ))}
            </div>

            {/* カスタムBGMアップロード */}
            <div className="mt-3 flex items-center gap-2">
              <input ref={bgmInputRef} type="file" accept="audio/*" onChange={handleBgmUpload} className="hidden" />
              <button type="button" onClick={() => bgmInputRef.current?.click()}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                📁 自分のBGMをアップ
              </button>
              {state.bgmFile && !state.bgmPresetId && (
                <span className="text-xs text-green-600">✓ カスタムBGM</span>
              )}
              {state.bgmFile && (
                <button type="button"
                  onClick={() => {
                    dispatch({ type: "SET_BGM", payload: null });
                    dispatch({ type: "SET_BGM_PRESET", payload: null });
                  }}
                  className="text-xs text-red-400 hover:text-red-600">削除</button>
              )}
            </div>
          </div>

          {/* 音量バランス */}
          <div className="border-t pt-4 space-y-3">
            <label className="block text-sm font-medium">🔊 音量バランス</label>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>BGM音量</span>
                <span>{Math.round(state.bgmVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="100" value={Math.round(state.bgmVolume * 100)}
                onChange={(e) => dispatch({ type: "SET_BGM_VOLUME", payload: Number(e.target.value) / 100 })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>ナレーション音量</span>
                <span>{Math.round(state.narrationVolume * 100)}%</span>
              </div>
              <input type="range" min="0" max="100" value={Math.round(state.narrationVolume * 100)}
                onChange={(e) => dispatch({ type: "SET_NARRATION_VOLUME", payload: Number(e.target.value) / 100 })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
            </div>
            <p className="text-[10px] text-gray-400">
              💡 ナレーション再生中はBGMが自動で小さくなります（ダッキング）
            </p>
          </div>

          <p className="text-xs text-gray-400">{currentTemplate?.description}</p>
        </div>
      </div>
    </div>
  );
}
