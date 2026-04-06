"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useRef, useCallback } from "react";
import type { VideoState, TemplateId } from "@/lib/types";
import { getTemplate } from "@/lib/templates";
import { QuoteCard } from "@/components/video/templates/QuoteCard";
import { KineticText } from "@/components/video/templates/KineticText";
import { GradientFadeIn } from "@/components/video/templates/GradientFadeIn";
import { MinimalZen } from "@/components/video/templates/MinimalZen";
import { StorySlides } from "@/components/video/templates/StorySlides";
import type { Dispatch } from "react";

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

type Action =
  | { type: "SET_EXPORT_STATUS"; payload: VideoState["exportStatus"] }
  | { type: "SET_EXPORT_PROGRESS"; payload: number }
  | { type: "SET_EXPORTED_URL"; payload: string | null };

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
};

export function Step3_PreviewExport({ state, dispatch }: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const currentTemplate = getTemplate(state.selectedTemplate);
  const fps = currentTemplate?.fps ?? 30;
  const durationInFrames = currentTemplate?.durationInFrames ?? 240;
  const TemplateComponent = getTemplateComponent(state.selectedTemplate);

  const handleExport = useCallback(async () => {
    dispatch({ type: "SET_EXPORT_STATUS", payload: "rendering" });
    dispatch({ type: "SET_EXPORT_PROGRESS", payload: 0 });

    try {
      // Canvas + MediaRecorder 方式でブラウザ内録画
      const playerEl = document.querySelector(
        "[data-remotion-player]"
      ) as HTMLElement | null;
      if (!playerEl) throw new Error("Player element not found");

      const video = playerEl.querySelector("video");
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      // プレイヤーの内容をCanvasにキャプチャする方式
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 8000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        dispatch({ type: "SET_EXPORTED_URL", payload: url });
        dispatch({ type: "SET_EXPORT_STATUS", payload: "done" });
      };

      recorder.start();

      // フレームごとにキャプチャ
      const totalFrames = durationInFrames;
      const frameDuration = 1000 / fps;

      // Playerを最初から再生
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }

      // 再生を監視してプログレス更新
      let frameCount = 0;
      const interval = setInterval(() => {
        frameCount++;
        const progress = Math.min((frameCount / totalFrames) * 100, 100);
        dispatch({ type: "SET_EXPORT_PROGRESS", payload: progress });

        // 簡易的にPlayerの表示をCanvasにコピー
        const playerContainer = playerEl.querySelector(
          "[data-remotion-canvas]"
        ) as HTMLCanvasElement | null;
        if (playerContainer) {
          ctx.drawImage(playerContainer, 0, 0, 1080, 1920);
        }

        if (frameCount >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
        }
      }, frameDuration);
    } catch {
      // フォールバック：シンプルなダウンロード方式
      // 簡易的にスクリーンショット的なアプローチ
      dispatch({ type: "SET_EXPORT_STATUS", payload: "error" });
    }
  }, [dispatch, durationInFrames, fps]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* フルプレビュー */}
      <div className="flex justify-center">
        <div className="w-[320px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl">
          <Player
            ref={playerRef}
            component={TemplateComponent}
            inputProps={{
              quoteText: state.quoteText || "ここに名言が表示されます",
              speakerName: state.speakerName,
              contextLine: state.contextLine,
              backgroundImage: state.backgroundImage,
              primaryColor: state.primaryColor,
              accentColor: state.accentColor,
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

      {/* 書き出しボタン */}
      <div className="text-center space-y-4">
        {state.exportStatus === "idle" && (
          <button
            onClick={handleExport}
            className="px-8 py-4 text-lg font-semibold text-white bg-amber-700 rounded-xl hover:bg-amber-800 transition-colors shadow-lg"
          >
            動画をダウンロード
          </button>
        )}

        {state.exportStatus === "rendering" && (
          <div className="space-y-3">
            <p className="text-gray-600">動画を生成中...</p>
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-3">
              <div
                className="bg-amber-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${state.exportProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">
              {Math.round(state.exportProgress)}%
            </p>
          </div>
        )}

        {state.exportStatus === "done" && state.exportedBlobUrl && (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">
              動画の生成が完了しました！
            </p>
            <a
              href={state.exportedBlobUrl}
              download={`rinri-video-${Date.now()}.webm`}
              className="inline-block px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-lg"
            >
              ダウンロード (.webm)
            </a>
            <p className="text-xs text-gray-400">
              ダウンロードした動画はInstagramリールにそのまま投稿できます
            </p>
          </div>
        )}

        {state.exportStatus === "error" && (
          <div className="space-y-3">
            <p className="text-red-500">
              動画の生成に失敗しました。もう一度お試しください。
            </p>
            <button
              onClick={() =>
                dispatch({ type: "SET_EXPORT_STATUS", payload: "idle" })
              }
              className="px-6 py-3 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              やり直す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
