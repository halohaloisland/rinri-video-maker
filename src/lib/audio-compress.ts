/**
 * 音声ファイルをGemini API送信用に圧縮
 *
 * 戦略：
 * - 8kHz モノラルにダウンサンプリング（音声認識には十分）
 * - 4MB以内に収まるよう、長い音声は複数箇所からサンプリング
 * - 4MB = 約4分（8kHz×16bit×mono）
 * - 30分のセミナー → 冒頭2分 + 中盤1分 + 終盤1分 を切り出し
 */

const TARGET_SAMPLE_RATE = 8000; // 8kHz（音声認識に十分）
const MAX_WAV_BYTES = 3_800_000; // 3.8MB（4.5MB制限に余裕を持たせる）
const BYTES_PER_SECOND = TARGET_SAMPLE_RATE * 2; // 16bit mono = 16KB/s
const MAX_AUDIO_SECONDS = Math.floor(MAX_WAV_BYTES / BYTES_PER_SECOND); // ~237秒

export async function compressAudioForTranscription(file: File): Promise<Blob> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const originalDuration = audioBuffer.duration;
  const originalSampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;

  console.log(`[AudioCompress] 元: ${originalDuration.toFixed(1)}秒, ${originalSampleRate}Hz, ${numberOfChannels}ch`);

  // モノラルにダウンミックス
  const originalLength = audioBuffer.length;
  const monoData = new Float32Array(originalLength);
  for (let i = 0; i < originalLength; i++) {
    let sum = 0;
    for (let ch = 0; ch < numberOfChannels; ch++) {
      sum += audioBuffer.getChannelData(ch)[i];
    }
    monoData[i] = sum / numberOfChannels;
  }

  // 8kHzにリサンプリング
  const ratio = originalSampleRate / TARGET_SAMPLE_RATE;
  const resampledLength = Math.floor(originalLength / ratio);
  const resampledData = new Float32Array(resampledLength);
  for (let i = 0; i < resampledLength; i++) {
    const srcIdx = Math.floor(i * ratio);
    resampledData[i] = monoData[Math.min(srcIdx, originalLength - 1)];
  }

  // 音声が長い場合、複数箇所からサンプリング
  const maxSamples = MAX_AUDIO_SECONDS * TARGET_SAMPLE_RATE;
  let finalData: Float32Array;

  if (resampledData.length <= maxSamples) {
    // 短い音声はそのまま使用
    finalData = resampledData;
  } else {
    // 長い音声: 冒頭50% + 中盤25% + 終盤25% を切り出し
    const headSamples = Math.floor(maxSamples * 0.5);
    const midSamples = Math.floor(maxSamples * 0.25);
    const tailSamples = maxSamples - headSamples - midSamples;

    const midStart = Math.floor(resampledData.length * 0.4);
    const tailStart = resampledData.length - tailSamples;

    finalData = new Float32Array(maxSamples);
    // 冒頭
    finalData.set(resampledData.subarray(0, headSamples), 0);
    // 中盤
    finalData.set(resampledData.subarray(midStart, midStart + midSamples), headSamples);
    // 終盤
    finalData.set(resampledData.subarray(tailStart, tailStart + tailSamples), headSamples + midSamples);

    console.log(`[AudioCompress] サンプリング: 冒頭${(headSamples/TARGET_SAMPLE_RATE).toFixed(0)}秒 + 中盤${(midSamples/TARGET_SAMPLE_RATE).toFixed(0)}秒 + 終盤${(tailSamples/TARGET_SAMPLE_RATE).toFixed(0)}秒`);
  }

  // WAVに変換
  const wavBlob = encodeWav(finalData, TARGET_SAMPLE_RATE);
  audioContext.close();

  console.log(`[AudioCompress] 圧縮後: ${(wavBlob.size / 1024 / 1024).toFixed(1)}MB`);
  return wavBlob;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const w = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  w(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  w(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
