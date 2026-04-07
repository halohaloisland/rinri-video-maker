import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";

type Props = {
  endingImage?: string | null;
  endingText?: string;
  endingTextSize?: number;
  endingSubText?: string;
  endingSubTextSize?: number;
  accentColor: string;
  speakerName?: string;
  contextLine?: string;
};

/**
 * エンディングシーン（動画の最後5秒に表示）
 * 全テンプレートで共通使用
 */
export function EndingScene({
  endingImage,
  endingText,
  endingTextSize = 56,
  endingSubText,
  endingSubTextSize = 36,
  accentColor,
  speakerName,
  contextLine,
}: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // エンディングは最後5秒（150フレーム @30fps）
  const endingStartFrame = durationInFrames - fps * 5;

  // フェードイン
  const opacity = interpolate(
    frame,
    [endingStartFrame, endingStartFrame + fps * 0.5],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // スケールアニメーション
  const scale = spring({
    frame: frame - endingStartFrame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });
  const scaleValue = interpolate(scale, [0, 1], [0.9, 1]);

  // Ken Burns
  const kenBurns = interpolate(
    frame,
    [endingStartFrame, durationInFrames],
    [1, 1.08],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // まだエンディング区間に入っていなければ何も表示しない
  if (frame < endingStartFrame) return null;

  const mainText = endingText || speakerName || "";
  const subText = endingSubText || contextLine || "";

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* 背景画像 */}
      {endingImage && (
        <>
          <div style={{
            position: "absolute", inset: 0,
            transform: `scale(${kenBurns})`,
            transformOrigin: "center center",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={endingImage} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(transparent 20%, rgba(0,0,0,0.75) 100%)",
          }} />
        </>
      )}

      {/* テキスト */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 80,
      }}>
        <div style={{
          transform: `scale(${scaleValue})`,
          textAlign: "center",
        }}>
          {mainText && (
            <div style={{
              fontSize: endingTextSize,
              color: "#ffffff",
              fontWeight: 600,
              marginBottom: 24,
              lineHeight: 1.4,
              textShadow: "0 2px 20px rgba(0,0,0,0.6)",
            }}>
              {mainText}
            </div>
          )}
          <div style={{
            width: 80, height: 2,
            backgroundColor: accentColor,
            margin: "0 auto 24px",
          }} />
          {subText && (
            <div style={{
              fontSize: endingSubTextSize,
              color: "#ffffffcc",
              fontWeight: 300,
              letterSpacing: 2,
              lineHeight: 1.5,
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}>
              {subText}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}
