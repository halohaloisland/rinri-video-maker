import { useCurrentFrame, useVideoConfig, interpolate, Img, AbsoluteFill } from "remotion";

type Props = {
  photos: string[];
  overlay?: boolean; // 暗いオーバーレイを表示するか
  overlayOpacity?: number;
};

/**
 * 写真スライドショー背景
 * 写真を均等に分割して表示し、Ken Burnsエフェクトで動かす
 */
export function PhotoSlideshow({ photos, overlay = true, overlayOpacity = 0.5 }: Props) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (photos.length === 0) return null;

  const framesPerPhoto = Math.floor(durationInFrames / photos.length);
  const transitionFrames = 20;

  return (
    <AbsoluteFill>
      {photos.map((photo, idx) => {
        const startFrame = idx * framesPerPhoto;
        const endFrame = startFrame + framesPerPhoto;

        // フェードイン/アウト
        const opacity = interpolate(
          frame,
          [
            startFrame,
            startFrame + transitionFrames,
            endFrame - transitionFrames,
            endFrame,
          ],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Ken Burns: ゆっくりズーム＋微妙なパン
        const scale = interpolate(
          frame,
          [startFrame, endFrame],
          [1, 1.15],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const panX = interpolate(
          frame,
          [startFrame, endFrame],
          idx % 2 === 0 ? [0, -3] : [-2, 2],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const panY = interpolate(
          frame,
          [startFrame, endFrame],
          idx % 3 === 0 ? [0, -2] : [1, -1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <AbsoluteFill key={idx} style={{ opacity }}>
            <div
              style={{
                position: "absolute",
                inset: -50,
                transform: `scale(${scale}) translate(${panX}%, ${panY}%)`,
                transformOrigin: "center center",
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
            {overlay && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(
                    180deg,
                    rgba(0,0,0,${overlayOpacity * 0.3}) 0%,
                    rgba(0,0,0,${overlayOpacity * 0.1}) 30%,
                    rgba(0,0,0,${overlayOpacity * 0.4}) 60%,
                    rgba(0,0,0,${overlayOpacity * 0.8}) 100%
                  )`,
                }}
              />
            )}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
}
