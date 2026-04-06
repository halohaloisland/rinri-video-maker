import type { BgmPreset } from "./types";

/**
 * BGMプリセット一覧
 * Web Audio APIで動的に生成するので、ファイル不要
 */
export const BGM_PRESETS: BgmPreset[] = [
  {
    id: "calm-piano",
    name: "穏やかなピアノ",
    description: "落ち着いた雰囲気のピアノBGM",
    url: "calm-piano",
  },
  {
    id: "uplifting",
    name: "前向きポップ",
    description: "明るく前向きなポップBGM",
    url: "uplifting",
  },
  {
    id: "corporate",
    name: "ビジネス・信頼感",
    description: "ビジネスシーン向けの落ち着いたBGM",
    url: "corporate",
  },
  {
    id: "emotional",
    name: "感動ストリングス",
    description: "心に響く感動的なBGM",
    url: "emotional",
  },
  {
    id: "japanese",
    name: "和風・癒し",
    description: "日本的な癒しのBGM",
    url: "japanese",
  },
];

/**
 * Web Audio API でBGMを動的に生成
 * 各プリセットに応じたシンプルなメロディを生成
 */
export async function generateBgmAudio(presetId: string): Promise<string> {
  const audioContext = new AudioContext({ sampleRate: 44100 });
  const duration = 35; // 30秒動画 + 余裕
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  // ノート周波数テーブル
  const noteFreq: Record<string, number> = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.26,
  };

  // プリセットごとのメロディとコード
  type ChordEntry = { notes: string[]; start: number; dur: number };
  let chords: ChordEntry[] = [];
  let tempo = 0.5; // 1拍あたりの秒数
  let waveType: "sine" | "triangle" = "sine";

  switch (presetId) {
    case "calm-piano":
      tempo = 0.6;
      waveType = "sine";
      chords = [
        { notes: ["C4", "E4", "G4"], start: 0, dur: 4 },
        { notes: ["A3", "C4", "E4"], start: 4, dur: 4 },
        { notes: ["F3", "A3", "C4"], start: 8, dur: 4 },
        { notes: ["G3", "B3", "D4"], start: 12, dur: 4 },
        { notes: ["C4", "E4", "G4"], start: 16, dur: 4 },
        { notes: ["D4", "F4", "A4"], start: 20, dur: 4 },
        { notes: ["E4", "G4", "B4"], start: 24, dur: 4 },
        { notes: ["C4", "E4", "G4", "C5"], start: 28, dur: 6 },
      ];
      break;
    case "uplifting":
      tempo = 0.45;
      waveType = "triangle";
      chords = [
        { notes: ["C4", "E4", "G4"], start: 0, dur: 2 },
        { notes: ["F4", "A4", "C5"], start: 2, dur: 2 },
        { notes: ["G4", "B4", "D5"], start: 4, dur: 2 },
        { notes: ["C4", "E4", "G4", "C5"], start: 6, dur: 2 },
        { notes: ["A3", "C4", "E4"], start: 8, dur: 2 },
        { notes: ["F3", "A3", "C4", "F4"], start: 10, dur: 2 },
        { notes: ["G3", "B3", "D4", "G4"], start: 12, dur: 2 },
        { notes: ["C4", "E4", "G4"], start: 14, dur: 3 },
        { notes: ["E4", "G4", "B4"], start: 17, dur: 2 },
        { notes: ["F4", "A4", "C5"], start: 19, dur: 2 },
        { notes: ["G4", "B4", "D5", "G4"], start: 21, dur: 3 },
        { notes: ["C4", "E4", "G4", "C5"], start: 24, dur: 4 },
        { notes: ["C4", "E4", "G4", "C5", "E5"], start: 28, dur: 6 },
      ];
      break;
    case "corporate":
      tempo = 0.55;
      waveType = "sine";
      chords = [
        { notes: ["C3", "G3", "C4"], start: 0, dur: 4 },
        { notes: ["F3", "C4", "F4"], start: 4, dur: 4 },
        { notes: ["G3", "D4", "G4"], start: 8, dur: 4 },
        { notes: ["C3", "E3", "G3", "C4"], start: 12, dur: 4 },
        { notes: ["A3", "E4", "A4"], start: 16, dur: 4 },
        { notes: ["F3", "C4", "F4"], start: 20, dur: 4 },
        { notes: ["G3", "B3", "D4"], start: 24, dur: 4 },
        { notes: ["C3", "E3", "G3", "C4"], start: 28, dur: 6 },
      ];
      break;
    case "emotional":
      tempo = 0.65;
      waveType = "sine";
      chords = [
        { notes: ["A3", "C4", "E4"], start: 0, dur: 4 },
        { notes: ["F3", "A3", "C4"], start: 4, dur: 4 },
        { notes: ["C4", "E4", "G4"], start: 8, dur: 4 },
        { notes: ["G3", "B3", "D4"], start: 12, dur: 4 },
        { notes: ["A3", "C4", "E4", "A4"], start: 16, dur: 4 },
        { notes: ["D4", "F4", "A4"], start: 20, dur: 4 },
        { notes: ["E4", "G4", "B4"], start: 24, dur: 4 },
        { notes: ["A3", "C4", "E4", "A4"], start: 28, dur: 6 },
      ];
      break;
    case "japanese":
      tempo = 0.7;
      waveType = "sine";
      chords = [
        { notes: ["A3", "E4"], start: 0, dur: 4 },
        { notes: ["C4", "G4"], start: 4, dur: 4 },
        { notes: ["D4", "A4"], start: 8, dur: 4 },
        { notes: ["E4", "B4"], start: 12, dur: 4 },
        { notes: ["A3", "E4", "A4"], start: 16, dur: 4 },
        { notes: ["C4", "E4"], start: 20, dur: 4 },
        { notes: ["D4", "A4"], start: 24, dur: 4 },
        { notes: ["A3", "E4", "A4"], start: 28, dur: 6 },
      ];
      break;
    default:
      chords = [{ notes: ["C4", "E4", "G4"], start: 0, dur: 30 }];
  }

  // 波形生成
  for (const chord of chords) {
    const startSample = Math.floor(chord.start * tempo * sampleRate);
    const durationSamples = Math.floor(chord.dur * tempo * sampleRate);

    for (const noteName of chord.notes) {
      const freq = noteFreq[noteName] || 440;

      for (let i = 0; i < durationSamples; i++) {
        const sampleIdx = startSample + i;
        if (sampleIdx >= leftChannel.length) break;

        const t = i / sampleRate;
        // エンベロープ: ADSR
        const attack = Math.min(1, t / 0.05);
        const release = Math.min(1, (durationSamples / sampleRate - t) / 0.3);
        const envelope = attack * release * 0.08;

        // 波形
        let sample: number;
        if (waveType === "triangle") {
          sample = (2 * Math.abs(2 * (t * freq - Math.floor(t * freq + 0.5))) - 1) * envelope;
        } else {
          sample = Math.sin(2 * Math.PI * freq * t) * envelope;
          // 倍音を少し追加（ピアノらしさ）
          sample += Math.sin(4 * Math.PI * freq * t) * envelope * 0.3;
          sample += Math.sin(6 * Math.PI * freq * t) * envelope * 0.1;
        }

        leftChannel[sampleIdx] += sample;
        rightChannel[sampleIdx] += sample;
      }
    }
  }

  // クリッピング防止
  for (let i = 0; i < leftChannel.length; i++) {
    leftChannel[i] = Math.max(-1, Math.min(1, leftChannel[i]));
    rightChannel[i] = Math.max(-1, Math.min(1, rightChannel[i]));
  }

  // WAV形式に変換
  const wavBlob = audioBufferToWav(buffer);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(wavBlob);
  });
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Audio data (interleaved)
  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
