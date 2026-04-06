import { useCurrentFrame, useVideoConfig, interpolate, Audio, Sequence } from "remotion";

type Props = {
  bgmFile?: string | null;
  narrationAudio?: string | null;
  bgmVolume?: number;
  narrationVolume?: number;
  narrationStartSec?: number;
};

/**
 * BGM + ナレーション音声レイヤー
 * - ナレーション開始タイミングを指定可能
 * - ナレーション再生中はBGMを自動ダッキング
 */
export function AudioLayer({
  bgmFile,
  narrationAudio,
  bgmVolume = 0.25,
  narrationVolume = 1.0,
  narrationStartSec = 2,
}: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const narrationStartFrame = Math.round(narrationStartSec * fps);

  // ナレーションがある場合、BGMをダッキング
  const hasNarration = !!narrationAudio;
  const duckStartFrame = narrationStartFrame;
  const duckEndFrame = durationInFrames - fps * 2;

  let effectiveBgmVolume = bgmVolume;
  if (hasNarration) {
    const duckAmount = interpolate(
      frame,
      [duckStartFrame - 15, duckStartFrame, duckEndFrame, duckEndFrame + 15],
      [1, 0.3, 0.3, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    effectiveBgmVolume = bgmVolume * duckAmount;
  }

  // BGMのフェードイン・フェードアウト
  const bgmFade = interpolate(
    frame,
    [0, fps * 0.5, durationInFrames - fps * 1, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <>
      {bgmFile && (
        <Audio src={bgmFile} volume={effectiveBgmVolume * bgmFade} />
      )}
      {narrationAudio && (
        <Sequence from={narrationStartFrame}>
          <Audio src={narrationAudio} volume={narrationVolume} />
        </Sequence>
      )}
    </>
  );
}
