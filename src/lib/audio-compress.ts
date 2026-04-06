/**
 * 音声ファイルをGemini API用に圧縮する
 * - モノラル化
 * - 16kHzにダウンサンプリング
 * - WAV形式に変換
 * これでセミナー音声（30分のMP3 ~30MB）→ ~3MB程度に圧縮
 */
export async function compressAudioForTranscription(file: File): Promise<Blob> {
  const audioContext = new AudioContext({ sampleRate: 16000 });

  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // モノラルにダウンミックス
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const monoData = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let ch = 0; ch < numberOfChannels; ch++) {
      sum += audioBuffer.getChannelData(ch)[i];
    }
    monoData[i] = sum / numberOfChannels;
  }

  // 16kHzにリサンプリング（AudioContextが自動でやってくれる場合が多いが念のため）
  const targetSampleRate = 16000;
  const ratio = audioBuffer.sampleRate / targetSampleRate;
  const newLength = Math.floor(length / ratio);
  const resampledData = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIdx = i * ratio;
    const srcIdxFloor = Math.floor(srcIdx);
    const srcIdxCeil = Math.min(srcIdxFloor + 1, length - 1);
    const frac = srcIdx - srcIdxFloor;
    resampledData[i] = monoData[srcIdxFloor] * (1 - frac) + monoData[srcIdxCeil] * frac;
  }

  // WAV形式に変換
  const wavBlob = encodeWav(resampledData, targetSampleRate);
  audioContext.close();

  return wavBlob;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bitDepth = 16;
  const numChannels = 1;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples.length * blockAlign;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, headerSize + dataSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // PCM data
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * ファイルサイズを人間が読める形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
