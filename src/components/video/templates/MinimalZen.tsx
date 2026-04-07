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

export function MinimalZen({
  titleText, titleFontSize = 52, titleFont = "Noto Sans JP",
  quoteText, speakerName, contextLine, primaryColor, accentColor,
  photos = [], endingImage, endingText, endingTextSize, endingSubText, endingSubTextSize,
  bgmFile, narrationAudio, bgmVolume, narrationVolume, narrationStartSec,
}: TemplateProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const hasPhotos = photos.length > 0;

  const text = quoteText || "ここに名言が表示されます";

  // コンテキスト（0〜5秒）
  const ctxOpacity = interpolate(frame, [0, 30, 120, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // 縦線アニメーション（3秒目〜）
  const lineH = interpolate(
    spring({ frame: frame - 90, fps, config: { damping: 25, stiffness: 60 } }),
    [0, 1], [0, 400]
  );

  // 上部装飾ライン
  const topLineW = interpolate(
    spring({ frame: frame - 60, fps, config: { damping: 30, stiffness: 50 } }),
    [0, 1], [0, 120]
  );

  // テキスト（5秒目〜）
  const textOpacity = interpolate(frame, [150, 200, durationInFrames - 150, durationInFrames - 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const textTranslateY = interpolate(
    spring({ frame: frame - 150, fps, config: { damping: 20, stiffness: 80 } }),
    [0, 1], [30, 0]
  );

  // 話者名（10秒目〜）
  const speakerOpacity = interpolate(frame, [300, 340, durationInFrames - 90, durationInFrames - 30], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // フェードアウト
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // 写真あり時のテキスト色
  const textColor = hasPhotos ? "#ffffff" : primaryColor;
  const bgColor = hasPhotos ? "#000" : "#faf8f5";

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, opacity: fadeOut }}>
      <AudioLayer bgmFile={bgmFile} narrationAudio={narrationAudio} bgmVolume={bgmVolume} narrationVolume={narrationVolume} narrationStartSec={narrationStartSec} />

      {hasPhotos && <PhotoSlideshow photos={photos} overlayOpacity={0.4} />}

      {/* タイトル（冒頭） */}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: ctxOpacity, gap: 20 }}>
        {titleText && (
          <div style={{
            fontSize: titleFontSize, fontFamily: titleFont, color: hasPhotos ? "#fff" : primaryColor, fontWeight: 700, letterSpacing: 2,
            textShadow: hasPhotos ? "0 2px 15px rgba(0,0,0,0.5)" : "none", textAlign: "center", padding: "0 60px",
          }}>
            {titleText}
          </div>
        )}
        {contextLine && (
          <div style={{
            fontSize: 28, color: hasPhotos ? "#ffffffcc" : `${primaryColor}99`,
            fontWeight: 400, letterSpacing: 6, textShadow: hasPhotos ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
          }}>
            {contextLine}
          </div>
        )}
      </AbsoluteFill>

      {/* 上部装飾ライン */}
      <div style={{
        position: "absolute", top: 350, left: "50%", transform: "translateX(-50%)",
        width: topLineW, height: 2, backgroundColor: accentColor,
      }} />

      {/* 中央の縦線 */}
      {!hasPhotos && (
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          width: 1.5, height: lineH, backgroundColor: `${accentColor}33`,
        }} />
      )}

      {/* メインテキスト */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 100 }}>
        <div style={{
          opacity: textOpacity, transform: `translateY(${textTranslateY}px)`,
          fontSize: text.length > 30 ? 52 : 68, color: textColor, fontWeight: 600,
          textAlign: "center", lineHeight: 2, maxWidth: 800, zIndex: 1, letterSpacing: 4,
          textShadow: hasPhotos ? "0 2px 20px rgba(0,0,0,0.6)" : "none",
        }}>
          {text}
        </div>
      </AbsoluteFill>

      {/* 下部装飾ライン */}
      <div style={{
        position: "absolute", bottom: 500, left: "50%", transform: "translateX(-50%)",
        width: topLineW, height: 2, backgroundColor: accentColor,
      }} />

      {/* 話者名 */}
      {speakerName && (
        <div style={{
          position: "absolute", bottom: 380, left: 0, right: 0, textAlign: "center",
          opacity: speakerOpacity, fontSize: 30,
          color: hasPhotos ? "#ffffffcc" : `${primaryColor}99`,
          fontWeight: 400, letterSpacing: 6,
          textShadow: hasPhotos ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
        }}>
          {speakerName}
        </div>
      )}

      <EndingScene endingImage={endingImage} endingText={endingText} endingTextSize={endingTextSize}
        endingSubText={endingSubText} endingSubTextSize={endingSubTextSize}
        accentColor={accentColor} speakerName={speakerName} contextLine={contextLine} />

      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 3,
        backgroundColor: accentColor, width: `${(frame / durationInFrames) * 100}%`, opacity: 0.4, zIndex: 20,
      }} />
    </AbsoluteFill>
  );
}
