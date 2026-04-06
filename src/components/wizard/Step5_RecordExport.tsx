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

      const drawLoop = () => {
        const elapsed = Date.now() - t0;
        setDownloadProgress(Math.min(Math.round((elapsed / totalMs) * 100), 99));

        // 背景
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, 1080, 1920);

        // タイトル（冒頭5秒）
        if (elapsed < 5000 && state.titleText) {
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${state.titleFontSize || 52}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(state.titleText, 540, 880);
          if (state.contextLine) {
            ctx.font = "28px sans-serif";
            ctx.fillStyle = "#ffffffaa";
            ctx.fillText(state.contextLine, 540, 960);
          }
        } else {
          // メインテキスト
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 56px sans-serif";
          ctx.textAlign = "center";
          const text = state.quoteText || "";
          const lines = text.match(/.{1,14}/g) || [text];
          lines.forEach((line, i) => {
            ctx.fillText(line, 540, 750 + i * 80);
          });
          ctx.fillStyle = accentColor;
          ctx.fillRect(440, 750 + lines.length * 80 + 20, 200, 3);
          if (state.speakerName) {
            ctx.font = "36px sans-serif";
            ctx.fillStyle = accentColor;
            ctx.fillText(state.speakerName, 540, 750 + lines.length * 80 + 80);
          }
        }

        // プログレスバー
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(0, 1916, 1080 * (elapsed / totalMs), 4);
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
    </div>
  );
}
