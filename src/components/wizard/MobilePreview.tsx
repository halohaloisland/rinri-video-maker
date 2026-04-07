"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VideoState } from "@/lib/types";

type Props = {
  state: VideoState;
  durationSec: number;
  fullscreen?: boolean;
  onExitFullscreen?: () => void;
};

/**
 * モバイル用シンプルプレビュー
 * Remotion Playerの代わりにCanvas + requestAnimationFrameで描画
 * メモリ使用量が少なく、モバイルブラウザでも動作する
 */
export function MobilePreview({ state, durationSec, fullscreen = false, onExitFullscreen }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const photoImagesRef = useRef<HTMLImageElement[]>([]);
  const endingImgRef = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // 画像プリロード
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    state.photos.forEach((src) => {
      const img = new Image();
      img.src = src;
      imgs.push(img);
    });
    photoImagesRef.current = imgs;

    if (state.endingImage) {
      const img = new Image();
      img.src = state.endingImage;
      endingImgRef.current = img;
    } else {
      endingImgRef.current = null;
    }
  }, [state.photos, state.endingImage]);

  // 写真をcanvasに描画（cover方式）
  const drawPhoto = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, scale: number) => {
    if (!img.naturalWidth) return;
    const aspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = w / h;
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
    const offset = (scale - 1) * w / 2;
    ctx.drawImage(img, sx, sy, sw, sh, -offset, -offset * (h / w), w * scale, h * scale);
  }, []);

  // テキスト折り返し
  const drawText = useCallback((ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) => {
    const chars = Array.from(text);
    let line = "";
    let cy = y;
    for (const c of chars) {
      const test = line + c;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cy);
        line = c;
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cy);
    return cy;
  }, []);

  // メイン描画ループ
  const draw = useCallback((elapsed: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const totalMs = durationSec * 1000;
    const progress = elapsed / totalMs;

    const photos = photoImagesRef.current;
    const hasPhotos = photos.length > 0;
    const titleDur = 5000;
    const endDur = 5000;
    const mainDur = totalMs - titleDur - endDur;
    const perPhoto = mainDur / Math.max(photos.length, 1);

    const primary = state.primaryColor || "#1e3a5f";
    const accent = state.accentColor || "#e8b04a";

    // 背景
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, w, h);

    // === タイトル（0-5秒） ===
    if (elapsed < titleDur) {
      if (hasPhotos) {
        drawPhoto(ctx, photos[0], w, h, 1 + (elapsed / titleDur) * 0.05);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      if (state.titleText) {
        ctx.font = `bold ${Math.round((state.titleFontSize || 52) * w / 1080)}px sans-serif`;
        drawText(ctx, state.titleText, w / 2, h * 0.42, w * 0.85, Math.round((state.titleFontSize || 52) * 1.4 * w / 1080));
      }
      if (state.contextLine) {
        ctx.font = `${Math.round(28 * w / 1080)}px sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(state.contextLine, w / 2, h * 0.52);
      }
    }
    // === メイン（5秒〜25秒） ===
    else if (elapsed < totalMs - endDur) {
      const mainEl = elapsed - titleDur;
      const photoIdx = Math.min(Math.floor(mainEl / perPhoto), photos.length - 1);
      const photoProg = (mainEl % perPhoto) / perPhoto;

      if (hasPhotos && photos[photoIdx]) {
        drawPhoto(ctx, photos[photoIdx], w, h, 1 + photoProg * 0.08);
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.5, "rgba(0,0,0,0.2)");
        grad.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.fillStyle = "#fff";
      const qSize = Math.round(((state.quoteText || "").length > 40 ? 48 : 56) * w / 1080);
      ctx.font = `bold ${qSize}px sans-serif`;
      ctx.textAlign = "center";
      const textY = hasPhotos ? h * 0.6 : h * 0.4;
      const lastY = drawText(ctx, state.quoteText || "", w / 2, textY, w * 0.88, qSize * 1.5);

      ctx.fillStyle = accent;
      ctx.fillRect(w * 0.4, lastY + 15, w * 0.2, 2);

      if (state.speakerName) {
        ctx.font = `${Math.round(36 * w / 1080)}px sans-serif`;
        ctx.fillStyle = accent;
        ctx.fillText(state.speakerName, w / 2, lastY + 50);
      }
    }
    // === エンディング（最後5秒） ===
    else {
      const endImg = endingImgRef.current;
      if (endImg && endImg.naturalWidth) {
        const endEl = elapsed - (totalMs - endDur);
        drawPhoto(ctx, endImg, w, h, 1 + (endEl / endDur) * 0.06);
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.4, "rgba(0,0,0,0.3)");
        grad.addColorStop(1, "rgba(0,0,0,0.75)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      const etSize = Math.round((state.endingTextSize || 56) * w / 1080);
      ctx.font = `bold ${etSize}px sans-serif`;
      const et = state.endingText || state.speakerName || "";
      if (et) drawText(ctx, et, w / 2, h * 0.44, w * 0.85, etSize * 1.4);

      ctx.fillStyle = accent;
      ctx.fillRect(w * 0.4, h * 0.5, w * 0.2, 2);

      const estSize = Math.round((state.endingSubTextSize || 36) * w / 1080);
      ctx.font = `300 ${estSize}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      const est = state.endingSubText || state.contextLine || "";
      if (est) ctx.fillText(est, w / 2, h * 0.55);
    }

    // プログレスバー
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, h - 3, w * progress, 3);
    ctx.globalAlpha = 1.0;
  }, [state, durationSec, drawPhoto, drawText]);

  // 再生制御
  const startPlay = useCallback(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    startTimeRef.current = Date.now();

    // BGM
    if (state.bgmFile) {
      try {
        const bgm = new Audio(state.bgmFile);
        bgm.volume = fullscreen ? Math.min(state.bgmVolume * 2, 1.0) : state.bgmVolume;
        bgm.play();
        bgmRef.current = bgm;
      } catch { /* ignore */ }
    }

    // ナレーション
    if (state.narrationAudio) {
      try {
        const nar = new Audio(state.narrationAudio);
        nar.volume = fullscreen ? 1.0 : state.narrationVolume;
        setTimeout(() => nar.play(), state.narrationStartSec * 1000);
        audioRef.current = nar;
      } catch { /* ignore */ }
    }

    const loop = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed >= durationSec * 1000) {
        setIsPlaying(false);
        setCurrentTime(durationSec);
        if (bgmRef.current) { bgmRef.current.pause(); bgmRef.current = null; }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        // 最終フレームを描画
        draw(durationSec * 1000);
        return;
      }
      setCurrentTime(elapsed / 1000);
      draw(elapsed);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  }, [state, durationSec, draw]);

  const stopPlay = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(animRef.current);
    if (bgmRef.current) { bgmRef.current.pause(); bgmRef.current = null; }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, []);

  // 初期描画
  useEffect(() => {
    draw(0);
  }, [draw]);

  // フルスクリーンUI表示制御
  const [showFsUi, setShowFsUi] = useState(true);
  const fsUiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // フルスクリーン時に自動再生 + UI自動非表示
  useEffect(() => {
    if (fullscreen && !isPlaying) {
      startPlay();
      // 3秒後にUIを隠す
      setShowFsUi(true);
      fsUiTimer.current = setTimeout(() => setShowFsUi(false), 3000);
    }
    return () => { if (fsUiTimer.current) clearTimeout(fsUiTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen]);

  const handleFsTap = useCallback(() => {
    setShowFsUi(prev => {
      if (!prev) {
        // 表示→3秒後に自動非表示
        if (fsUiTimer.current) clearTimeout(fsUiTimer.current);
        fsUiTimer.current = setTimeout(() => setShowFsUi(false), 3000);
      }
      return !prev;
    });
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      if (bgmRef.current) bgmRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // フルスクリーンモード
  if (fullscreen) {
    return (
      <div
        style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          zIndex: 99999, backgroundColor: "#000",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onClick={handleFsTap}
      >
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          style={{
            maxWidth: "100vw", maxHeight: "100vh",
            width: "auto", height: "100vh",
            display: "block",
          }}
        />
        {/* 閉じるボタン（タップで表示、3秒後に自動非表示） */}
        {showFsUi && (
          <button
            onClick={(e) => { e.stopPropagation(); stopPlay(); onExitFullscreen?.(); }}
            style={{
              position: "absolute", top: 50, right: 16, width: 44, height: 44,
              backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
              borderRadius: 22, fontSize: 20, zIndex: 100000, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // 通常モード
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-[280px] max-w-[calc(100vw-2rem)] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? stopPlay : startPlay}
          className="px-5 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800 transition-colors"
        >
          {isPlaying ? "⏸ 停止" : "▶️ 再生"}
        </button>
        <span className="text-xs text-gray-500">
          {Math.floor(currentTime)}秒 / {durationSec}秒
        </span>
      </div>
    </div>
  );
}
