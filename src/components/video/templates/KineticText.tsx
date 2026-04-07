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
import { EndingScene } from "../elements/EndingScene";

export function KineticText({
  titleText, titleFontSize = 52, titleFont = "Noto Sans JP",
  quoteText, speakerName, contextLine, primaryColor, accentColor,
  photos = [], endingImage, endingText, endingTextSize, endingSubText, endingSubTextSize,
  bgmFile, narrationAudio, bgmVolume, narrationVolume, narrationStartSec,
}: TemplateProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const hasPhotos = photos.length > 0;

  const text = quoteText || "ここに名言が表示されます";
  const chars = Array.from(text);

  const hueShift = interpolate(frame, [0, durationInFrames], [0, 30]);

  // コンテキスト（0〜5秒）
  const ctxOpacity = interpolate(frame, [0, 30, 120, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // テキスト開始を5秒目から（150フレーム）
  const textStartFrame = 150;
  const charDelay = Math.min(4, Math.floor((durationInFrames - textStartFrame - 300) / chars.length));

  // 話者名
  const speakerDelay = textStartFrame + chars.length * charDelay + 60;
  const speakerOpacity = interpolate(frame, [speakerDelay, speakerDelay + 30, durationInFrames - 60, durationInFrames - 30], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // フェードアウト
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: hasPhotos ? "#000" : `linear-gradient(160deg, ${primaryColor}, ${primaryColor}cc)`,
        filter: hasPhotos ? undefined : `hue-rotate(${hueShift}deg)`,
        opacity: fadeOut,
      }}
    >
      <AudioLayer bgmFile={bgmFile} narrationAudio={narrationAudio} bgmVolume={bgmVolume} narrationVolume={narrationVolume} narrationStartSec={narrationStartSec} />

      {hasPhotos && <PhotoSlideshow photos={photos} overlayOpacity={0.6} />}

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

      {/* メインテキスト */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8, maxWidth: 900 }}>
          {chars.map((char, i) => {
            const delay = textStartFrame + i * charDelay;
            const scale = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 150, mass: 0.5 } });
            const opacity = interpolate(frame - delay, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

            return (
              <span key={i} style={{
                display: "inline-block", fontSize: chars.length > 30 ? 52 : 68,
                fontWeight: 800, color: "#ffffff", transform: `scale(${scale})`, opacity,
                textShadow: hasPhotos ? "0 2px 15px rgba(0,0,0,0.7)" : "none",
              }}>
                {char}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* 話者名 */}
      {speakerName && (
        <div style={{
          position: "absolute", bottom: 300, left: 0, right: 0, textAlign: "center",
          opacity: speakerOpacity, fontSize: 36, color: accentColor, fontWeight: 500, letterSpacing: 4,
          textShadow: hasPhotos ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
        }}>
          ― {speakerName}
        </div>
      )}

      <EndingScene endingImage={endingImage} endingText={endingText} endingTextSize={endingTextSize}
        endingSubText={endingSubText} endingSubTextSize={endingSubTextSize}
        accentColor={accentColor} speakerName={speakerName} contextLine={contextLine} />

      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 4,
        backgroundColor: accentColor, width: `${(frame / durationInFrames) * 100}%`, opacity: 0.6, zIndex: 20,
      }} />
    </AbsoluteFill>
  );
}
