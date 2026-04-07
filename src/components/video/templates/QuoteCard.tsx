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

export function QuoteCard({
  titleText, titleFontSize = 52, titleFont = "Noto Sans JP",
  quoteText, speakerName, contextLine, primaryColor, accentColor,
  photos = [], endingImage, endingText, endingTextSize, endingSubText, endingSubTextSize,
  bgmFile, narrationAudio, bgmVolume, narrationVolume, narrationStartSec,
}: TemplateProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const hasPhotos = photos.length > 0;
  const text = quoteText || "ここに名言が表示されます";

  // 背景グラデーション
  const gradientAngle = interpolate(frame, [0, durationInFrames], [135, 155]);

  // コンテキスト（0〜5秒目）
  const ctxOpacity = interpolate(frame, [0, 30, 120, 150], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // 装飾引用符（4秒目〜）
  const quoteMarkOpacity = interpolate(frame, [120, 160], [0, 0.15], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const quoteMarkScale = spring({ frame: frame - 120, fps, config: { damping: 15, stiffness: 80 } });

  // メインテキスト（5秒目〜25秒目）
  const textOpacity = interpolate(frame, [150, 200, durationInFrames - 180, durationInFrames - 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const textY = spring({ frame: frame - 150, fps, config: { damping: 20, stiffness: 100 } });
  const textTranslateY = interpolate(textY, [0, 1], [40, 0]);

  // アクセントライン
  const lineWidth = spring({ frame: frame - 220, fps, config: { damping: 20, stiffness: 60 } });
  const lineWidthPx = interpolate(lineWidth, [0, 1], [0, 200]);

  // 話者名（8秒目〜）
  const speakerOpacity = interpolate(frame, [240, 280, durationInFrames - 120, durationInFrames - 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const speakerTranslateY = interpolate(
    spring({ frame: frame - 240, fps, config: { damping: 20, stiffness: 100 } }),
    [0, 1], [20, 0]
  );

  // フェードアウト
  const fadeOut = interpolate(frame, [durationInFrames - 30, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: hasPhotos ? "#000" : `linear-gradient(${gradientAngle}deg, ${primaryColor}, ${primaryColor}dd, ${primaryColor}99)`,
        opacity: fadeOut,
      }}
    >
      <AudioLayer bgmFile={bgmFile} narrationAudio={narrationAudio} bgmVolume={bgmVolume} narrationVolume={narrationVolume} narrationStartSec={narrationStartSec} />

      {/* 写真背景 */}
      {hasPhotos && <PhotoSlideshow photos={photos} overlayOpacity={0.6} />}

      {/* タイトル（冒頭） */}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: ctxOpacity, gap: 20 }}>
        {titleText && (
          <div style={{ fontSize: titleFontSize, fontFamily: titleFont, color: "#ffffff", fontWeight: 700, letterSpacing: 2, textShadow: "0 2px 15px rgba(0,0,0,0.5)", textAlign: "center", padding: "0 60px" }}>
            {titleText}
          </div>
        )}
        {contextLine && (
          <div style={{ fontSize: 30, color: "#ffffffcc", fontWeight: 400, letterSpacing: 4, textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {contextLine}
          </div>
        )}
      </AbsoluteFill>

      {/* 装飾引用符 */}
      <div style={{
        position: "absolute", top: 280, left: 80, fontSize: 300, color: accentColor,
        opacity: quoteMarkOpacity, transform: `scale(${quoteMarkScale})`,
        fontFamily: "Georgia, serif", lineHeight: 1,
      }}>
        &ldquo;
      </div>

      {/* メインコンテンツ */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40, zIndex: 1 }}>
          <div style={{
            opacity: textOpacity, transform: `translateY(${textTranslateY}px)`,
            fontSize: text.length > 60 ? 48 : text.length > 30 ? 60 : 76,
            color: "#ffffff", fontWeight: 700, textAlign: "center", lineHeight: 1.7,
            maxWidth: 900, textShadow: hasPhotos ? "0 2px 20px rgba(0,0,0,0.7)" : "none",
          }}>
            {text}
          </div>

          <div style={{ width: lineWidthPx, height: 3, backgroundColor: accentColor, borderRadius: 2, opacity: textOpacity }} />

          {speakerName && (
            <div style={{
              opacity: speakerOpacity, transform: `translateY(${speakerTranslateY}px)`,
              fontSize: 36, color: accentColor, fontWeight: 500, letterSpacing: 2,
              textShadow: hasPhotos ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
            }}>
              {speakerName}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* エンディング */}
      <EndingScene endingImage={endingImage} endingText={endingText} endingTextSize={endingTextSize}
        endingSubText={endingSubText} endingSubTextSize={endingSubTextSize}
        accentColor={accentColor} speakerName={speakerName} contextLine={contextLine} />

      {/* プログレスバー */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 4,
        backgroundColor: accentColor, width: `${(frame / durationInFrames) * 100}%`, opacity: 0.6,
        zIndex: 20,
      }} />
    </AbsoluteFill>
  );
}
