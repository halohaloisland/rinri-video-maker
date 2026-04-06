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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const narrationInputRef = useRef<HTMLInputElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          dispatch({
            type: "SET_NARRATION_AUDIO",
            payload: { data: reader.result as string, name: "recording.webm" },
          });
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
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    dispatch({ type: "SET_RECORDING", payload: false });
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, [dispatch]);

  const handleNarrationUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({
          type: "SET_NARRATION_AUDIO",
          payload: { data: reader.result as string, name: file.name },
        });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  // ===== 動画書き出し（Remotionサーバーサイドレンダリング） =====
  const handleExport = useCallback(async () => {
    dispatch({ type: "SET_EXPORT_STATUS", payload: "rendering" });
    dispatch({ type: "SET_EXPORT_PROGRESS", payload: 5 });

    try {
      // プログレス更新用タイマー（サーバー側の進行は分からないので推定）
      const estimatedDurationMs = durationInFrames / fps * 2000; // 実時間の2倍を想定
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(5 + (elapsed / estimatedDurationMs) * 85, 90);
        dispatch({ type: "SET_EXPORT_PROGRESS", payload: progress });
      }, 500);

      // サーバーサイドレンダリングAPI呼び出し
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: state.selectedTemplate,
          durationInFrames,
          fps,
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
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      dispatch({ type: "SET_EXPORT_PROGRESS", payload: 95 });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      dispatch({ type: "SET_EXPORTED_URL", payload: url });
      dispatch({ type: "SET_EXPORT_STATUS", payload: "done" });
      dispatch({ type: "SET_EXPORT_PROGRESS", payload: 100 });
    } catch (err) {
      console.error("Export error:", err);
      dispatch({ type: "SET_EXPORT_STATUS", payload: "error" });
    }
  }, [dispatch, durationInFrames, fps, state]);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

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
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={state.narrationStartSec}
              onChange={(e) => dispatch({ type: "SET_NARRATION_START_SEC", payload: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
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
          <div id="export-player-container" className="w-[280px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl">
            <Player
              ref={playerRef}
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
                bgmFile: state.bgmFile,
                narrationAudio: state.narrationAudio,
                bgmVolume: state.bgmVolume,
                narrationVolume: state.narrationVolume,
                narrationStartSec: state.narrationStartSec,
              }}
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
        </div>
      </div>

      {/* 書き出し */}
      <div className="text-center space-y-4 border-t pt-8">
        {state.exportStatus === "idle" && (
          <button onClick={handleExport}
            className="px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg">
            🎬 動画をダウンロード
          </button>
        )}

        {state.exportStatus === "rendering" && (
          <div className="space-y-3">
            <p className="text-gray-600">動画を生成中...（約{durationSec}秒かかります）</p>
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3">
              <div className="bg-amber-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${state.exportProgress}%` }} />
            </div>
            <p className="text-sm text-gray-400">{Math.round(state.exportProgress)}%</p>
          </div>
        )}

        {state.exportStatus === "done" && state.exportedBlobUrl && (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">🎉 動画の生成が完了しました！</p>
            <a href={state.exportedBlobUrl} download={`seminar-reel-${Date.now()}.mp4`}
              className="inline-block px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-lg">
              ⬇️ ダウンロード (.mp4)
            </a>
            <p className="text-xs text-gray-400">MP4形式 — Instagramリールにそのままアップロードできます</p>
            <button onClick={() => dispatch({ type: "SET_EXPORT_STATUS", payload: "idle" })}
              className="text-sm text-amber-600 underline">もう一度書き出す</button>
          </div>
        )}

        {state.exportStatus === "error" && (
          <div className="space-y-3">
            <p className="text-red-500">動画の生成に失敗しました。もう一度お試しください。</p>
            <button onClick={() => dispatch({ type: "SET_EXPORT_STATUS", payload: "idle" })}
              className="px-6 py-3 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50">やり直す</button>
          </div>
        )}
      </div>
    </div>
  );
}
