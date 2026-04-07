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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [ttsVoice, setTtsVoice] = useState("Kore");
  const [isTTSGenerating, setIsTTSGenerating] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

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

  // フルスクリーン: body scroll lockを管理
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      // iOSでアドレスバーを隠す
      window.scrollTo(0, 1);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

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

  // ===== AI音声生成 (Gemini TTS) =====
  const handleGenerateTTS = useCallback(async () => {
    if (!state.narrationScript) return;
    setIsTTSGenerating(true);
    setTtsError(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: state.narrationScript,
          voice: ttsVoice,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "音声生成に失敗しました");

      dispatch({
        type: "SET_NARRATION_AUDIO",
        payload: { data: data.audio, name: `AI音声(${data.voiceDescription})` },
      });
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : "音声生成に失敗しました");
    } finally {
      setIsTTSGenerating(false);
    }
  }, [state.narrationScript, ttsVoice, dispatch]);

  // ===== フルスクリーン再生（CSS方式 - iOS対応） =====
  const handleFullscreenPlay = useCallback(() => {
    setIsFullscreen(true);
    // 少し待ってから再生開始
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
    }, 300);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (playerRef.current) {
      playerRef.current.pause();
    }
  }, []);

  // ===== PC用ダウンロード（Canvas + MediaRecorder） =====
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);
    setDownloadUrl(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      // 音声ミキシング
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      let hasAudio = false;

      if (state.bgmFile) {
        try {
          const buf = await (await fetch(state.bgmFile)).arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(buf);
          const src = audioCtx.createBufferSource();
          src.buffer = decoded;
          const gain = audioCtx.createGain();
          gain.gain.value = state.bgmVolume;
          src.connect(gain);
          gain.connect(dest);
          src.start();
          hasAudio = true;
        } catch (e) { console.warn("BGM:", e); }
      }

      if (state.narrationAudio) {
        try {
          const buf = await (await fetch(state.narrationAudio)).arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(buf);
          const src = audioCtx.createBufferSource();
          src.buffer = decoded;
          const gain = audioCtx.createGain();
          gain.gain.value = state.narrationVolume;
          src.connect(gain);
          gain.connect(dest);
          src.start(audioCtx.currentTime + state.narrationStartSec);
          hasAudio = true;
        } catch (e) { console.warn("Narration:", e); }
      }

      const videoStream = canvas.captureStream(fps);
      if (hasAudio) {
        dest.stream.getAudioTracks().forEach((t) => videoStream.addTrack(t));
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus" : "video/webm";
      const recorder = new MediaRecorder(videoStream, { mimeType, videoBitsPerSecond: 5_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          audioCtx.close();
          resolve(new Blob(chunks, { type: "video/webm" }));
        };
      });

      // 画像をプリロード
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = src;
        });

      const photoImages = await Promise.all(state.photos.map(loadImage));
      const endingImg = state.endingImage ? await loadImage(state.endingImage) : null;

      // Remotion Player を再生
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
      recorder.start(100);

      const totalMs = (durationInFrames / fps) * 1000;
      const t0 = Date.now();
      const primaryColor = state.primaryColor || "#1e3a5f";
      const accentColor = state.accentColor || "#e8b04a";
      const hasPhotos = photoImages.length > 0;

      // シーン構成
      const titleDuration = 5000; // 5秒
      const endingDuration = 5000; // 最後5秒
      const mainDuration = totalMs - titleDuration - endingDuration;
      const photoCount = photoImages.length || 1;
      const perPhotoMs = mainDuration / photoCount;

      // テキスト折り返し描画ヘルパー
      const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const chars = Array.from(text);
        let line = "";
        let currentY = y;
        for (const char of chars) {
          const testLine = line + char;
          if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, x, currentY);
            line = char;
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line) ctx.fillText(line, x, currentY);
        return currentY;
      };

      // 写真をcanvasに描画（cover方式）
      const drawPhoto = (img: HTMLImageElement, scale: number) => {
        if (!img.naturalWidth) return;
        const aspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = 1080 / 1920;
        let sw: number, sh: number, sx: number, sy: number;
        if (aspect > canvasAspect) {
          sh = img.naturalHeight;
          sw = sh * canvasAspect;
          sx = (img.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          sw = img.naturalWidth;
          sh = sw / canvasAspect;
          sx = 0;
          sy = (img.naturalHeight - sh) / 2;
        }
        const offset = (scale - 1) * 540;
        ctx.drawImage(img, sx, sy, sw, sh, -offset, -offset * (1920 / 1080), 1080 * scale, 1920 * scale);
      };

      const drawLoop = () => {
        const elapsed = Date.now() - t0;
        const progress = elapsed / totalMs;
        setDownloadProgress(Math.min(Math.round(progress * 75), 75)); // 前半75%

        // === シーン1: タイトル（0〜5秒） ===
        if (elapsed < titleDuration) {
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, 1080, 1920);
          if (hasPhotos) {
            drawPhoto(photoImages[0], 1 + (elapsed / titleDuration) * 0.05);
            // 暗いオーバーレイ
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0, 0, 1080, 1920);
          }
          // タイトル
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${state.titleFontSize || 52}px sans-serif`;
          ctx.textAlign = "center";
          if (state.titleText) {
            drawWrappedText(state.titleText, 540, 860, 900, 70);
          }
          if (state.contextLine) {
            ctx.font = "28px sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.fillText(state.contextLine, 540, 980);
          }
        }
        // === シーン2: メイン（写真＋テキスト） ===
        else if (elapsed < totalMs - endingDuration) {
          const mainElapsed = elapsed - titleDuration;
          const currentPhotoIdx = Math.min(Math.floor(mainElapsed / perPhotoMs), photoCount - 1);
          const photoProgress = (mainElapsed % perPhotoMs) / perPhotoMs;

          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, 1080, 1920);

          if (hasPhotos && photoImages[currentPhotoIdx]) {
            const scale = 1 + photoProgress * 0.08; // Ken Burns
            drawPhoto(photoImages[currentPhotoIdx], scale);
            // グラデーションオーバーレイ
            const grad = ctx.createLinearGradient(0, 0, 0, 1920);
            grad.addColorStop(0, "transparent");
            grad.addColorStop(0.5, "rgba(0,0,0,0.2)");
            grad.addColorStop(1, "rgba(0,0,0,0.7)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1080, 1920);
          }

          // メインテキスト
          ctx.fillStyle = "#ffffff";
          const qSize = (state.quoteText || "").length > 40 ? 48 : 56;
          ctx.font = `bold ${qSize}px sans-serif`;
          ctx.textAlign = "center";
          const textY = hasPhotos ? 1200 : 750;
          const lastY = drawWrappedText(state.quoteText || "", 540, textY, 920, qSize * 1.5);

          // アクセントライン
          ctx.fillStyle = accentColor;
          ctx.fillRect(440, lastY + 30, 200, 3);

          // 話者名
          if (state.speakerName) {
            ctx.font = "36px sans-serif";
            ctx.fillStyle = accentColor;
            ctx.fillText(state.speakerName, 540, lastY + 80);
          }
        }
        // === シーン3: エンディング（最後5秒） ===
        else {
          ctx.fillStyle = primaryColor;
          ctx.fillRect(0, 0, 1080, 1920);

          if (endingImg && endingImg.naturalWidth) {
            const endElapsed = elapsed - (totalMs - endingDuration);
            drawPhoto(endingImg, 1 + (endElapsed / endingDuration) * 0.06);
            const grad = ctx.createLinearGradient(0, 0, 0, 1920);
            grad.addColorStop(0, "transparent");
            grad.addColorStop(0.4, "rgba(0,0,0,0.3)");
            grad.addColorStop(1, "rgba(0,0,0,0.75)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1080, 1920);
          }

          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${state.endingTextSize || 56}px sans-serif`;
          ctx.textAlign = "center";
          const et = state.endingText || state.speakerName || "";
          if (et) drawWrappedText(et, 540, 880, 900, 70);

          ctx.fillStyle = accentColor;
          ctx.fillRect(440, 960, 200, 2);

          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = `300 ${state.endingSubTextSize || 36}px sans-serif`;
          const est = state.endingSubText || state.contextLine || "";
          if (est) ctx.fillText(est, 540, 1020);
        }

        // プログレスバー
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(0, 1916, 1080 * progress, 4);
        ctx.globalAlpha = 1.0;

        if (elapsed < totalMs) {
          requestAnimationFrame(drawLoop);
        } else {
          recorder.stop();
          playerRef.current?.pause();
        }
      };
      requestAnimationFrame(drawLoop);

      const webmBlob = await done;
      setDownloadProgress(80);

      // WebM → MP4 変換（ffmpeg.wasm）
      let finalBlob = webmBlob;
      let ext = "webm";
      try {
        setDownloadError("MP4に変換中...");
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL, fetchFile } = await import("@ffmpeg/util");

        const ffmpeg = new FFmpeg();
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        setDownloadProgress(88);
        await ffmpeg.writeFile("input.webm", await fetchFile(webmBlob));

        setDownloadProgress(92);
        await ffmpeg.exec([
          "-i", "input.webm",
          "-c:v", "libx264", "-preset", "fast", "-crf", "23",
          "-c:a", "aac", "-b:a", "128k",
          "-movflags", "+faststart", "-pix_fmt", "yuv420p",
          "output.mp4",
        ]);

        setDownloadProgress(97);
        const mp4Data = await ffmpeg.readFile("output.mp4");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        finalBlob = new Blob([(mp4Data as any).buffer ?? mp4Data], { type: "video/mp4" });
        ext = "mp4";
        setDownloadError(null);
      } catch (e) {
        console.warn("MP4変換失敗、WebMで出力:", e);
        setDownloadError(null);
        // WebMのままフォールバック
      }

      const url = URL.createObjectURL(finalBlob);
      setDownloadUrl(url);
      setDownloadProgress(100);

      // 自動ダウンロード
      const a = document.createElement("a");
      a.href = url;
      a.download = `seminar-reel-${Date.now()}.${ext}`;
      a.click();
    } catch (err) {
      console.error("Download error:", err);
      setDownloadError("録画に失敗しました。もう一度お試しください。");
    } finally {
      setIsDownloading(false);
    }
  }, [state, durationInFrames, fps]);

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

          {/* ナレーション3択セクション */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-600">🎙️ ナレーション音声</h4>
            <p className="text-xs text-gray-400">3つの方法から選べます</p>

            {/* 方法1: AI音声生成 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 space-y-3">
              <h5 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                🤖 方法1: AI音声で自動生成（おすすめ）
              </h5>
              <div className="flex items-center gap-3">
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white"
                >
                  <option value="Kore">👩 女性・落ち着いた声</option>
                  <option value="Aoede">👩 女性・明るい声</option>
                  <option value="Charon">👨 男性・低め落ち着いた声</option>
                  <option value="Fenrir">👨 男性・力強い声</option>
                  <option value="Puck">👨 男性・親しみやすい声</option>
                </select>
                <button
                  type="button"
                  onClick={handleGenerateTTS}
                  disabled={isTTSGenerating || !state.narrationScript}
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
                >
                  {isTTSGenerating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      生成中...
                    </>
                  ) : (
                    "✨ AI音声を生成"
                  )}
                </button>
              </div>
              {!state.narrationScript && (
                <p className="text-xs text-purple-400">※ ナレーション台本が必要です（Step2で設定）</p>
              )}
              {ttsError && (
                <p className="text-xs text-red-500">{ttsError}</p>
              )}
            </div>

            {/* 方法2: 自分の声で録音 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                🎤 方法2: 自分の声で録音
              </h5>
              <div className="flex items-center gap-3">
                {!state.isRecording ? (
                  <button type="button" onClick={startRecording}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    録音開始
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording}
                    className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                    停止 ({formatTime(recordingTime)})
                  </button>
                )}
                {state.isRecording && (
                  <span className="flex items-center gap-2 text-red-500 text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    録音中...
                  </span>
                )}
              </div>
            </div>

            {/* 方法3: ファイルアップロード */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                📁 方法3: 音声ファイルをアップロード
              </h5>
              <div className="flex items-center gap-3">
                <input ref={narrationInputRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" onChange={handleNarrationUpload} className="hidden" />
                <button type="button" onClick={() => narrationInputRef.current?.click()}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                  ファイルを選択
                </button>
                <span className="text-xs text-gray-400">外部で録音した音声もOK</span>
              </div>
            </div>

            {/* 現在のナレーション音声 */}
            {state.narrationAudio && !state.isRecording && (
              <div className="bg-green-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 text-sm font-medium">✅ {state.narrationFileName}</span>
                  <button type="button" onClick={() => dispatch({ type: "SET_NARRATION_AUDIO", payload: null })}
                    className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">削除</button>
                </div>
                <audio
                  src={state.narrationAudio}
                  controls
                  className="h-8 w-full"
                  onLoadedMetadata={(e) => {
                    const audio = e.currentTarget;
                    const dur = audio.duration;
                    if (dur && isFinite(dur)) {
                      const min = Math.floor(dur / 60);
                      const sec = Math.floor(dur % 60);
                      const durationEl = audio.parentElement?.querySelector("[data-duration]");
                      if (durationEl) durationEl.textContent = `音声の長さ: ${min}分${sec.toString().padStart(2, "0")}秒`;
                    }
                  }}
                />
                <p data-duration className="text-xs text-green-700 font-medium">音声の長さ: 読み込み中...</p>
              </div>
            )}
          </div>
        </div>

        {/* 右: プレビュー */}
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-lg font-bold text-gray-800">▶️ プレビュー</h3>
          <div className="w-[280px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl">
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
        </div>
      </div>

      {/* 動画にする セクション */}
      <div className="border-t pt-8 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">📱 動画にする</h3>
          <p className="text-sm text-gray-500">フルスクリーンで再生して、スマホの画面録画で撮影しましょう</p>
        </div>

        {/* ボタン2つ: スマホ用 + PC用 */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* スマホ: フルスクリーン再生 */}
          <button onClick={handleFullscreenPlay}
            className="px-8 py-5 text-lg font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-xl flex items-center justify-center gap-3">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
            📱 フルスクリーンで再生
          </button>

          {/* PC: 動画ダウンロード */}
          <button onClick={handleDownload}
            disabled={isDownloading}
            className="px-8 py-5 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-wait transition-all shadow-xl flex items-center justify-center gap-3">
            {isDownloading ? (
              <>
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                録画中... {downloadProgress}%
              </>
            ) : (
              <>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                💻 PC用ダウンロード
              </>
            )}
          </button>
        </div>

        {downloadError && (
          <p className="text-center text-sm text-red-500">{downloadError}</p>
        )}

        {downloadUrl && (
          <div className="text-center space-y-3 bg-green-50 rounded-xl p-5 max-w-md mx-auto">
            <p className="text-green-700 font-medium">🎉 動画の録画が完了しました！</p>
            <a href={downloadUrl} download={`seminar-reel-${Date.now()}.mp4`}
              className="inline-block px-6 py-3 text-base font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow">
              ⬇️ もう一度ダウンロード
            </a>
            <p className="text-xs text-gray-500">MP4形式 — Instagramリールにそのままアップロード可能</p>
          </div>
        )}

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

      {/* ===== フルスクリーンオーバーレイ（CSS方式 - iOS対応） ===== */}
      {isFullscreen && (
        <div
          ref={fullscreenContainerRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* 動画プレイヤー（画面いっぱいに9:16で表示） */}
          <div style={{
            width: "100%",
            height: "100%",
            maxWidth: `${(window?.innerHeight ?? 800) * 9 / 16}px`,
            maxHeight: "100%",
          }}>
            <Player
              ref={playerRef}
              component={TemplateComponent}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              fps={fps}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%" }}
              autoPlay
              loop
            />
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={exitFullscreen}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "#fff",
              border: "none",
              fontSize: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 100000,
            }}
          >
            ✕
          </button>

          {/* 再生開始ヒント（タップで消える） */}
          <div
            onClick={() => {
              if (playerRef.current) {
                playerRef.current.seekTo(0);
                playerRef.current.play();
              }
            }}
            style={{
              position: "absolute",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "8px 20px",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#fff",
              borderRadius: 20,
              fontSize: 14,
              whiteSpace: "nowrap",
              zIndex: 100000,
            }}
          >
            タップで最初から再生 ▶️
          </div>
        </div>
      )}
    </div>
  );
}
