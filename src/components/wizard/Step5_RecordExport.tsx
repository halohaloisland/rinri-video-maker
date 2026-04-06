"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useRef, useCallback, useState, useEffect } from "react";
import type { VideoState, TemplateId } from "@/lib/types";
import { getTemplate } from "@/lib/templates";
import { QuoteCard } from "@/components/video/templates/QuoteCard";
import { KineticText } from "@/components/video/templates/KineticText";
import { GradientFadeIn } from "@/components/video/templates/GradientFadeIn";
import { MinimalZen } from "@/components/video/templates/MinimalZen";
import { StorySlides } from "@/components/video/templates/StorySlides";
import type { Dispatch } from "react";
import type { Action } from "@/hooks/useVideoState";

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

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
};

export function Step5_RecordExport({ state, dispatch }: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const narrationInputRef = useRef<HTMLInputElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const currentTemplate = getTemplate(state.selectedTemplate);
  const fps = currentTemplate?.fps ?? 30;
  const durationInFrames = currentTemplate?.durationInFrames ?? 900;
  const TemplateComponent = getTemplateComponent(state.selectedTemplate);
  const durationSec = Math.round(durationInFrames / fps);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // フルスクリーン切り替え
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ===== ナレーション録音 =====
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus" : "audio/webm",
      });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          dispatch({ type: "SET_NARRATION_AUDIO", payload: { data: reader.result as string, name: "recording.webm" } });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      dispatch({ type: "SET_RECORDING", payload: true });
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch {
      alert("マイクへのアクセスが許可されませんでした。");
    }
  }, [dispatch]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    dispatch({ type: "SET_RECORDING", payload: false });
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
  }, [dispatch]);

  const handleNarrationUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: "SET_NARRATION_AUDIO", payload: { data: reader.result as string, name: file.name } });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  // ===== フルスクリーン再生 =====
  const handleFullscreenPlay = useCallback(() => {
    const container = fullscreenContainerRef.current;
    if (!container) return;

    if (container.requestFullscreen) {
      container.requestFullscreen();
    }

    // 少し待ってから再生開始
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
    }, 500);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const inputProps = {
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
    bgmFile: state.bgmFile,
    narrationAudio: state.narrationAudio,
    bgmVolume: state.bgmVolume,
    narrationVolume: state.narrationVolume,
    narrationStartSec: state.narrationStartSec,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左: ナレーション台本 */}
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">📝 ナレーション台本</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <p className="text-lg leading-loose text-gray-800 whitespace-pre-wrap">
              {state.narrationScript || "（ナレーション台本が設定されていません）"}
            </p>
          </div>
          <p className="text-xs text-gray-400">動画の長さ: {durationSec}秒</p>

          {/* ナレーション開始タイミング */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">⏱️ ナレーション開始タイミング</span>
              <span className="text-amber-700 font-bold">{state.narrationStartSec}秒後</span>
            </div>
            <input type="range" min="0" max="10" step="0.5" value={state.narrationStartSec}
              onChange={(e) => dispatch({ type: "SET_NARRATION_START_SEC", payload: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0秒（すぐ開始）</span>
              <span>10秒後</span>
            </div>
          </div>

          {/* 録音セクション */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-600">🎙️ ナレーション録音</h4>
            <div className="flex items-center gap-3">
              {!state.isRecording ? (
                <button type="button" onClick={startRecording}
                  className="px-5 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-white" />
                  録音開始
                </button>
              ) : (
                <button type="button" onClick={stopRecording}
                  className="px-5 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-white" />
                  録音停止 ({formatTime(recordingTime)})
                </button>
              )}
              {state.isRecording && (
                <span className="flex items-center gap-2 text-red-500 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  録音中...
                </span>
              )}
            </div>

            {state.narrationAudio && !state.isRecording && (
              <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                <span className="text-green-600 text-sm font-medium">✅ {state.narrationFileName}</span>
                <audio src={state.narrationAudio} controls className="h-8" />
                <button type="button" onClick={() => dispatch({ type: "SET_NARRATION_AUDIO", payload: null })}
                  className="text-xs text-red-400 hover:text-red-600">削除</button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input ref={narrationInputRef} type="file" accept="audio/*" onChange={handleNarrationUpload} className="hidden" />
              <button type="button" onClick={() => narrationInputRef.current?.click()}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                📁 音声ファイルをアップロード
              </button>
              <span className="text-xs text-gray-400">外部で録音した音声もOK</span>
            </div>
          </div>
        </div>

        {/* 右: プレビュー */}
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800">▶️ プレビュー</h3>
          <div ref={fullscreenContainerRef}
            className={`${isFullscreen ? "w-full h-full flex items-center justify-center bg-black" : "w-[280px] aspect-[9/16]"} rounded-2xl overflow-hidden shadow-2xl`}>
            <div className={isFullscreen ? "h-full aspect-[9/16]" : "w-full h-full"}>
              <Player
                ref={playerRef}
                component={TemplateComponent}
                inputProps={inputProps}
                durationInFrames={durationInFrames}
                fps={fps}
                compositionWidth={1080}
                compositionHeight={1920}
                style={{ width: "100%", height: "100%" }}
                controls
                autoPlay
                loop
              />
            </div>
            {/* フルスクリーン時の閉じるボタン */}
            {isFullscreen && (
              <button onClick={exitFullscreen}
                className="absolute top-4 right-4 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center text-lg z-50 hover:bg-black/80">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 動画にする セクション */}
      <div className="border-t pt-8 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">📱 動画にする</h3>
          <p className="text-sm text-gray-500">フルスクリーンで再生して、スマホの画面録画で撮影しましょう</p>
        </div>

        {/* フルスクリーン再生ボタン */}
        <div className="flex justify-center">
          <button onClick={handleFullscreenPlay}
            className="px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-xl flex items-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            フルスクリーンで再生
          </button>
        </div>

        {/* 画面録画ガイド */}
        <div className="max-w-lg mx-auto">
          <button onClick={() => setShowGuide(!showGuide)}
            className="w-full text-left px-5 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">📖 画面録画のやり方</span>
            <span className="text-gray-400">{showGuide ? "▲" : "▼"}</span>
          </button>

          {showGuide && (
            <div className="mt-3 space-y-4 px-2">
              {/* iPhone */}
              <div className="bg-blue-50 rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-blue-800 flex items-center gap-2">
                  <span className="text-lg">📱</span> iPhoneの場合
                </h4>
                <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
                  <li><strong>コントロールセンター</strong>を開く（右上から下スワイプ）</li>
                  <li><strong>画面収録ボタン ⏺️</strong> を長押し</li>
                  <li><strong>マイク ON</strong> にする（ナレーションを声で入れる場合）</li>
                  <li><strong>「収録を開始」</strong>をタップ（3秒カウントダウン）</li>
                  <li>上の<strong>「フルスクリーンで再生」</strong>ボタンを押す</li>
                  <li>動画が終わったら<strong>左上の赤いバー</strong>をタップして録画停止</li>
                  <li>写真アプリに保存された動画を<strong>Instagramにアップロード</strong>！</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  💡 コントロールセンターに画面収録がない場合：<br/>
                  設定 → コントロールセンター → 「画面収録」を追加
                </p>
              </div>

              {/* Android */}
              <div className="bg-green-50 rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-green-800 flex items-center gap-2">
                  <span className="text-lg">🤖</span> Androidの場合
                </h4>
                <ol className="text-sm text-green-900 space-y-2 list-decimal list-inside">
                  <li><strong>クイック設定パネル</strong>を下にスワイプ</li>
                  <li><strong>「スクリーンレコード」</strong>をタップ</li>
                  <li><strong>「デバイスの音声を録音」</strong>を選択</li>
                  <li><strong>「開始」</strong>をタップ</li>
                  <li>上の<strong>「フルスクリーンで再生」</strong>ボタンを押す</li>
                  <li>動画が終わったら通知バーから<strong>録画停止</strong></li>
                </ol>
              </div>

              {/* PC */}
              <div className="bg-purple-50 rounded-xl p-5 space-y-3">
                <h4 className="font-bold text-purple-800 flex items-center gap-2">
                  <span className="text-lg">💻</span> PCの場合
                </h4>
                <div className="text-sm text-purple-900 space-y-1">
                  <p><strong>Mac:</strong> Shift + Command + 5 → 画面収録</p>
                  <p><strong>Windows:</strong> Win + G → ゲームバー → 録画ボタン</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ヒント */}
        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>💡 スマホを横にせず<strong>縦のまま</strong>フルスクリーン再生すると、リールにピッタリのサイズになります</p>
          <p>💡 Wi-Fi環境で録画すると通知が入りにくくなります</p>
        </div>
      </div>
    </div>
  );
}
