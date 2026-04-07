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
 *
 * 自動音量バランス（ダッキング）:
 * - ナレーションがある場合、BGMが自動で30%まで下がる
 * - ナレーション開始1秒前にフェードダウン開始
 * - ナレーション終了2秒前にフェードアップ開始
 * - BGM自体にもフェードイン（0.5秒）・フェードアウト（1秒）あり
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

  // ===== BGM音量計算 =====
  let effectiveBgmVolume = bgmVolume;

  if (narrationAudio) {
    // ダッキング: ナレーション開始1秒前からBGMを30%に下げる
    const duckFadeInStart = narrationStartFrame - fps * 1; // 1秒前
    const duckFadeInEnd = narrationStartFrame;              // ナレーション開始時に完了

    // ダッキング解除: 動画終了2秒前からBGMを元に戻す
    const duckFadeOutStart = durationInFrames - fps * 2;    // 2秒前
    const duckFadeOutEnd = durationInFrames - fps * 1;      // 1秒前に完了

    const duckMultiplier = interpolate(
      frame,
      [
        duckFadeInStart,   // ダッキング開始（BGM 100%）
        duckFadeInEnd,     // ダッキング完了（BGM 30%）
        duckFadeOutStart,  // ダッキング解除開始（BGM 30%）
        duckFadeOutEnd,    // ダッキング解除完了（BGM 100%）
      ],
      [1, 0.3, 0.3, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    effectiveBgmVolume = bgmVolume * duckMultiplier;
  }

  // BGM自体のフェードイン（0.5秒）・フェードアウト（1秒）
  const bgmFade = interpolate(
    frame,
    [0, Math.round(fps * 0.5), durationInFrames - fps, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ===== ナレーション音量計算 =====
  // ナレーションにもフェードイン（0.3秒）・フェードアウト（0.5秒）
  const narrationFadeDuration = durationInFrames - narrationStartFrame;
  const narrationFade = interpolate(
    frame - narrationStartFrame,
    [0, Math.round(fps * 0.3), narrationFadeDuration - Math.round(fps * 0.5), narrationFadeDuration],
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
          <Audio src={narrationAudio} volume={narrationVolume * narrationFade} />
        </Sequence>
      )}
    </>
  );
}
