import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
} from "remotion";
import type { TemplateProps } from "@/lib/types";
import { PhotoSlideshow } from "../elements/PhotoSlideshow";
import { AudioLayer } from "../elements/AudioLayer";

export function GradientFadeIn({
  titleText, titleFontSize = 52, titleFont = "Noto Sans JP",
  quoteText, speakerName, contextLine, primaryColor, accentColor,
  photos = [], bgmFile, narrationAudio, bgmVolume, narrationVolume, narrationStartSec,
}: TemplateProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const hasPhotos = photos.length > 0;

  const text = quoteText || "ここに名言が表示されます";
  const lines = text.match(/.{1,15}/g) || [text];

  const gradAngle = interpolate(frame, [0, durationInFrames], [120, 200]);

  // コンテキスト（0〜5秒）
  const ctxOpacity = interpolate(frame, [0, 30, 120, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // テキスト開始：5秒目（150フレーム）
  const textStart = 150;
  const lineDelay = Math.min(20, Math.floor(300 / lines.length));

  // 話者名
  const speakerDelay = textStart + lines.length * lineDelay + 60;
  const speakerSpring = spring({ frame: frame - speakerDelay, fps, config: { damping: 20, stiffness: 80 } });
  const speakerFadeOut = interpolate(frame, [durationInFrames - 90, durationInFrames - 30], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // パーティクル
  const particles = Array.from({ length: 15 }, (_, i) => ({
    x: ((i * 137) % 100), startY: 100 + ((i * 73) % 50),
    speed: 0.3 + (i % 5) * 0.1, size: 2 + (i % 4), opacity: 0.1 + (i % 5) * 0.05,
  }));

  return (
    <AbsoluteFill
      style={{
        background: hasPhotos ? "#000" : `linear-gradient(${gradAngle}deg, ${primaryColor}, ${accentColor}88, ${primaryColor}dd)`,
        opacity: fadeOut,
      }}
    >
      <AudioLayer bgmFile={bgmFile} narrationAudio={narrationAudio} bgmVolume={bgmVolume} narrationVolume={narrationVolume} narrationStartSec={narrationStartSec} />

      {hasPhotos && <PhotoSlideshow photos={photos} overlayOpacity={0.55} />}

      {/* パーティクル */}
      {!hasPhotos && particles.map((p, i) => {
        const y = p.startY - (frame * p.speed) % 120;
        return (
          <div key={i} style={{
            position: "absolute", left: `${p.x}%`, top: `${y}%`,
            width: p.size, height: p.size, borderRadius: "50%",
            backgroundColor: "#ffffff", opacity: p.opacity,
          }} />
        );
      })}

      {/* タイトル（冒頭） */}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: ctxOpacity, gap: 20 }}>
        {titleText && (
          <div style={{ fontSize: titleFontSize, fontFamily: titleFont, color: "#fff", fontWeight: 700, letterSpacing: 2, textShadow: "0 2px 15px rgba(0,0,0,0.5)", textAlign: "center", padding: "0 60px" }}>
            {titleText}
          </div>
        )}
        {contextLine && (
          <div style={{ fontSize: 30, color: "#ffffffcc", fontWeight: 400, letterSpacing: 4, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {contextLine}
          </div>
        )}
      </AbsoluteFill>

      {/* テキスト */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, zIndex: 1 }}>
          {lines.map((line, i) => {
            const delay = textStart + i * lineDelay;
            const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const translateY = interpolate(
              spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 80 } }),
              [0, 1], [25, 0]
            );
            return (
              <div key={i} style={{
                opacity, transform: `translateY(${translateY}px)`,
                fontSize: lines.length > 4 ? 46 : 58, color: "#ffffff", fontWeight: 700,
                textAlign: "center", lineHeight: 1.5,
                textShadow: "0 2px 20px rgba(0,0,0,0.4)",
              }}>
                {line}
              </div>
            );
          })}

          {speakerName && (
            <div style={{
              opacity: speakerSpring * speakerFadeOut, fontSize: 32, color: "#ffffffcc",
              fontWeight: 400, marginTop: 30, letterSpacing: 3,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}>
              {speakerName}
            </div>
          )}
        </div>
      </AbsoluteFill>

      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 4,
        backgroundColor: "#ffffff", width: `${(frame / durationInFrames) * 100}%`, opacity: 0.4,
      }} />
    </AbsoluteFill>
  );
}
