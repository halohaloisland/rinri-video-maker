import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
  Img,
} from "remotion";
import type { TemplateProps } from "@/lib/types";
import { AudioLayer } from "../elements/AudioLayer";

export function StorySlides({
  titleText, titleFontSize = 52, titleFont = "Noto Sans JP",
  quoteText, speakerName, contextLine, primaryColor, accentColor,
  photos = [], endingImage, endingText, endingTextSize = 56, endingSubText, endingSubTextSize = 36,
  bgmFile, narrationAudio, bgmVolume, narrationVolume, narrationStartSec,
}: TemplateProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const text = quoteText || "ここに名言が表示されます";
  const hasPhotos = photos.length > 0;

  // シーン分割（写真がある場合は写真枚数＋1シーン）
  const sceneCount = hasPhotos ? photos.length + 1 : 3;
  const framesPerScene = Math.floor(durationInFrames / sceneCount);

  // Ken Burnsエフェクト（ゆっくりズーム）
  const kenBurnsScale = (sceneStart: number) =>
    interpolate(frame, [sceneStart, sceneStart + framesPerScene], [1, 1.1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // フェードイン/アウト
  const sceneOpacity = (sceneStart: number) =>
    interpolate(
      frame,
      [sceneStart, sceneStart + 15, sceneStart + framesPerScene - 15, sceneStart + framesPerScene],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

  // テキストアニメーション
  const textSpring = (sceneStart: number) =>
    spring({
      frame: frame - sceneStart,
      fps,
      config: { damping: 18, stiffness: 90 },
    });

  return (
    <AbsoluteFill style={{ backgroundColor: primaryColor }}>
      <AudioLayer bgmFile={bgmFile} narrationAudio={narrationAudio} bgmVolume={bgmVolume} narrationVolume={narrationVolume} narrationStartSec={narrationStartSec} />

      {/* === 写真スライドショーモード === */}
      {hasPhotos && (
        <>
          {photos.map((photo, idx) => {
            const sceneStart = idx * framesPerScene;
            const opacity = sceneOpacity(sceneStart);
            const scale = kenBurnsScale(sceneStart);
            const textY = interpolate(
              textSpring(sceneStart + 30),
              [0, 1],
              [40, 0]
            );

            return (
              <AbsoluteFill key={idx} style={{ opacity }}>
                {/* 写真背景 */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `scale(${scale})`,
                    transformOrigin: idx % 2 === 0 ? "center center" : "60% 40%",
                  }}
                >
                  <Img
                    src={photo}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                {/* 暗いオーバーレイ */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(transparent 40%, rgba(0,0,0,0.7) 100%)",
                  }}
                />
                {/* テキスト（最後の写真に名言を表示） */}
                {idx === photos.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 200,
                      left: 60,
                      right: 60,
                      transform: `translateY(${textY}px)`,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: text.length > 40 ? 48 : 60,
                        color: "#ffffff",
                        fontWeight: 700,
                        lineHeight: 1.7,
                        textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                      }}
                    >
                      {text}
                    </div>
                  </div>
                )}
                {/* 写真番号（最後以外） */}
                {idx < photos.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 300,
                      left: 80,
                      right: 80,
                      textAlign: "center",
                      transform: `translateY(${textY}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 36,
                        color: "#ffffff",
                        fontWeight: 500,
                        textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                        letterSpacing: 2,
                      }}
                    >
                      {contextLine || "セミナーの様子"}
                    </div>
                  </div>
                )}
              </AbsoluteFill>
            );
          })}

          {/* 最終シーン: エンディング */}
          <AbsoluteFill
            style={{
              opacity: sceneOpacity(photos.length * framesPerScene),
            }}
          >
            {/* エンディング画像背景 */}
            {endingImage && (
              <>
                <div style={{
                  position: "absolute", inset: 0,
                  transform: `scale(${kenBurnsScale(photos.length * framesPerScene)})`,
                  transformOrigin: "center center",
                }}>
                  <Img src={endingImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 30%, rgba(0,0,0,0.7) 100%)" }} />
              </>
            )}
            {/* テキスト */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 80,
            }}>
              <div style={{
                transform: `scale(${interpolate(textSpring(photos.length * framesPerScene), [0, 1], [0.9, 1])})`,
                textAlign: "center",
              }}>
                <div style={{ fontSize: endingTextSize, color: "#ffffff", fontWeight: 600, marginBottom: 20, textShadow: "0 2px 15px rgba(0,0,0,0.5)", lineHeight: 1.4 }}>
                  {endingText || speakerName || ""}
                </div>
                <div style={{ width: 80, height: 2, backgroundColor: accentColor, margin: "0 auto 30px" }} />
                <div style={{ fontSize: endingSubTextSize, color: "#ffffffcc", fontWeight: 300, letterSpacing: 2, textShadow: "0 2px 10px rgba(0,0,0,0.5)", lineHeight: 1.5 }}>
                  {endingSubText || contextLine || "倫理法人会モーニングセミナー"}
                </div>
              </div>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* === 写真なし: 従来の3シーンモード === */}
      {!hasPhotos && (
        <>
          {/* シーン1: コンテキスト */}
          <AbsoluteFill
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: sceneOpacity(0), padding: 100,
            }}
          >
            <div
              style={{
                transform: `scale(${interpolate(textSpring(0), [0, 1], [0.8, 1])})`,
                textAlign: "center",
              }}
            >
              {titleText && (
                <div style={{ fontSize: titleFontSize, fontFamily: titleFont, color: "#ffffff", fontWeight: 700, lineHeight: 1.6, marginBottom: 20 }}>
                  {titleText}
                </div>
              )}
              {!titleText && (
                <div style={{ fontSize: 44, color: "#ffffff", fontWeight: 600, lineHeight: 1.6, marginBottom: 20 }}>
                  今日の学び
                </div>
              )}
              <div style={{ width: 60, height: 2, backgroundColor: accentColor, margin: "0 auto 20px" }} />
              <div style={{ fontSize: 28, color: `${accentColor}cc`, fontWeight: 400, letterSpacing: 4 }}>
                {contextLine || "倫理法人会モーニングセミナー"}
              </div>
            </div>
          </AbsoluteFill>

          {/* シーン2: メイン名言 */}
          <AbsoluteFill
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: sceneOpacity(framesPerScene), padding: 80,
            }}
          >
            <div
              style={{
                transform: `translateY(${interpolate(textSpring(framesPerScene), [0, 1], [50, 0])}px)`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, color: accentColor, marginBottom: 20, fontFamily: "Georgia, serif" }}>
                &ldquo;
              </div>
              <div
                style={{
                  fontSize: text.length > 40 ? 52 : 68,
                  color: "#ffffff", fontWeight: 700, lineHeight: 1.7,
                  maxWidth: 900, textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                }}
              >
                {text}
              </div>
              <div style={{ fontSize: 40, color: accentColor, marginTop: 20, fontFamily: "Georgia, serif" }}>
                &rdquo;
              </div>
            </div>
          </AbsoluteFill>

          {/* シーン3: エンディング */}
          <AbsoluteFill style={{ opacity: sceneOpacity(2 * framesPerScene) }}>
            {endingImage && (
              <>
                <div style={{
                  position: "absolute", inset: 0,
                  transform: `scale(${kenBurnsScale(2 * framesPerScene)})`,
                  transformOrigin: "center center",
                }}>
                  <Img src={endingImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 30%, rgba(0,0,0,0.7) 100%)" }} />
              </>
            )}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 100,
            }}>
              <div style={{
                transform: `scale(${interpolate(textSpring(2 * framesPerScene), [0, 1], [0.9, 1])})`,
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: endingTextSize, color: "#ffffff", fontWeight: 600, marginBottom: 20, lineHeight: 1.4,
                  textShadow: endingImage ? "0 2px 15px rgba(0,0,0,0.5)" : "none",
                }}>
                  {endingText || speakerName || ""}
                </div>
                <div style={{ width: 80, height: 2, backgroundColor: accentColor, margin: "0 auto 30px" }} />
                <div style={{
                  fontSize: endingSubTextSize, color: "#ffffffcc", fontWeight: 300, letterSpacing: 2, lineHeight: 1.5,
                  textShadow: endingImage ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
                }}>
                  {endingSubText || contextLine || "倫理法人会モーニングセミナー"}
                </div>
              </div>
            </div>
          </AbsoluteFill>
        </>
      )}

      {/* プログレスバー */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, height: 4,
          backgroundColor: accentColor,
          width: `${(frame / durationInFrames) * 100}%`,
          opacity: 0.6, zIndex: 10,
        }}
      />
    </AbsoluteFill>
  );
}
