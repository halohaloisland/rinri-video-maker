import type { BgmPreset } from "./types";

export const BGM_PRESETS: BgmPreset[] = [
  { id: "cinematic", name: "シネマティック", description: "映画のような感動的BGM", url: "cinematic" },
  { id: "inspiring", name: "インスパイアリング", description: "前向きで力強いBGM", url: "inspiring" },
  { id: "gentle-piano", name: "優しいピアノ", description: "穏やかで温かいピアノBGM", url: "gentle-piano" },
  { id: "dramatic", name: "ドラマチック", description: "盛り上がりのある壮大なBGM", url: "dramatic" },
  { id: "zen", name: "和風・禅", description: "静かで心落ち着くBGM", url: "zen" },
];

// ノート→周波数
const N: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.26, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
};

type ChordProg = { notes: string[]; bass: string; start: number; dur: number }[];

function getPresetData(id: string): { chords: ChordProg; arpPattern: number[]; bpm: number; style: "pad" | "pluck" | "warm" } {
  switch (id) {
    case "cinematic":
      return {
        bpm: 70, style: "pad",
        arpPattern: [0, 2, 1, 2, 0, 2, 1, 3],
        chords: [
          { notes: ["C4", "E4", "G4", "B4"], bass: "C3", start: 0, dur: 8 },
          { notes: ["A3", "C4", "E4", "G4"], bass: "A2", start: 8, dur: 8 },
          { notes: ["F3", "A3", "C4", "F4"], bass: "F2", start: 16, dur: 8 },
          { notes: ["G3", "B3", "D4", "G4"], bass: "G2", start: 24, dur: 4 },
          { notes: ["E3", "G3", "B3", "E4"], bass: "E2", start: 28, dur: 4 },
          { notes: ["F3", "A3", "C4", "E4"], bass: "F2", start: 32, dur: 4 },
          { notes: ["G3", "B3", "D4", "F4"], bass: "G2", start: 36, dur: 4 },
          { notes: ["C4", "E4", "G4", "C5"], bass: "C3", start: 40, dur: 8 },
        ],
      };
    case "inspiring":
      return {
        bpm: 90, style: "pluck",
        arpPattern: [0, 1, 2, 3, 2, 1, 0, 3],
        chords: [
          { notes: ["C4", "E4", "G4"], bass: "C3", start: 0, dur: 4 },
          { notes: ["F4", "A4", "C5"], bass: "F3", start: 4, dur: 4 },
          { notes: ["G4", "B4", "D5"], bass: "G3", start: 8, dur: 4 },
          { notes: ["A3", "C4", "E4"], bass: "A2", start: 12, dur: 4 },
          { notes: ["F3", "A3", "C4"], bass: "F2", start: 16, dur: 4 },
          { notes: ["D4", "F4", "A4"], bass: "D3", start: 20, dur: 4 },
          { notes: ["G3", "B3", "D4", "G4"], bass: "G2", start: 24, dur: 4 },
          { notes: ["C4", "E4", "G4", "C5"], bass: "C3", start: 28, dur: 8 },
          { notes: ["E4", "G4", "B4", "E5"], bass: "E3", start: 36, dur: 4 },
          { notes: ["F4", "A4", "C5"], bass: "F3", start: 40, dur: 4 },
          { notes: ["G4", "B4", "D5"], bass: "G3", start: 44, dur: 4 },
          { notes: ["C4", "E4", "G4", "C5"], bass: "C3", start: 48, dur: 8 },
        ],
      };
    case "gentle-piano":
      return {
        bpm: 72, style: "warm",
        arpPattern: [0, 2, 1, 3, 0, 1, 2, 3],
        chords: [
          { notes: ["C4", "E4", "G4"], bass: "C3", start: 0, dur: 8 },
          { notes: ["A3", "C4", "E4"], bass: "A2", start: 8, dur: 8 },
          { notes: ["F3", "A3", "C4"], bass: "F2", start: 16, dur: 8 },
          { notes: ["G3", "B3", "D4"], bass: "G2", start: 24, dur: 8 },
          { notes: ["E3", "G3", "C4"], bass: "E2", start: 32, dur: 8 },
          { notes: ["A3", "C4", "E4", "A4"], bass: "A2", start: 40, dur: 8 },
        ],
      };
    case "dramatic":
      return {
        bpm: 80, style: "pad",
        arpPattern: [0, 1, 2, 3, 3, 2, 1, 0],
        chords: [
          { notes: ["A3", "C4", "E4", "A4"], bass: "A2", start: 0, dur: 6 },
          { notes: ["F3", "A3", "C4", "F4"], bass: "F2", start: 6, dur: 6 },
          { notes: ["D3", "F3", "A3", "D4"], bass: "D2", start: 12, dur: 6 },
          { notes: ["E3", "G3", "B3", "E4"], bass: "E2", start: 18, dur: 6 },
          { notes: ["A3", "C4", "E4", "A4"], bass: "A2", start: 24, dur: 4 },
          { notes: ["B3", "D4", "F4", "A4"], bass: "B2", start: 28, dur: 4 },
          { notes: ["C4", "E4", "G4", "C5"], bass: "C3", start: 32, dur: 4 },
          { notes: ["D4", "F4", "A4", "D5"], bass: "D3", start: 36, dur: 4 },
          { notes: ["E4", "G4", "B4", "E5"], bass: "E3", start: 40, dur: 4 },
          { notes: ["A3", "C4", "E4", "A4"], bass: "A2", start: 44, dur: 8 },
        ],
      };
    case "zen":
    default:
      return {
        bpm: 55, style: "warm",
        arpPattern: [0, 2, 0, 1],
        chords: [
          { notes: ["A3", "E4"], bass: "A2", start: 0, dur: 12 },
          { notes: ["D4", "A4"], bass: "D3", start: 12, dur: 12 },
          { notes: ["E4", "B4"], bass: "E3", start: 24, dur: 6 },
          { notes: ["A3", "E4", "A4"], bass: "A2", start: 30, dur: 12 },
        ],
      };
  }
}

/**
 * ドラマチックなBGMを生成
 * 3層構造: パッド（持続和音）+ アルペジオ + ベースライン
 * + シンプルリバーブ
 */
export async function generateBgmAudio(presetId: string): Promise<string> {
  const sampleRate = 44100;
  const duration = 30;
  const totalSamples = sampleRate * duration;
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const { chords, arpPattern, bpm, style } = getPresetData(presetId);
  const beatSec = 60 / bpm;
  const totalBeats = Math.ceil(duration / beatSec);

  // 現在のビートで鳴っているコードを取得
  const getChordAt = (beat: number) => {
    for (let i = chords.length - 1; i >= 0; i--) {
      if (beat >= chords[i].start) return chords[i];
    }
    return chords[0];
  };

  // ===== Layer 1: パッド（持続和音）=====
  for (const chord of chords) {
    const startSample = Math.floor(chord.start * beatSec * sampleRate);
    const durSamples = Math.floor(chord.dur * beatSec * sampleRate);

    for (const note of chord.notes) {
      const freq = N[note] || 440;
      for (let i = 0; i < durSamples; i++) {
        const idx = startSample + i;
        if (idx >= totalSamples) break;
        const t = i / sampleRate;
        // 柔らかいアタック＋長いリリース
        const attack = Math.min(1, t / 0.8);
        const release = Math.min(1, (durSamples / sampleRate - t) / 1.0);
        const env = attack * release;

        let s: number;
        if (style === "pad") {
          // リッチなパッド: 基音 + デチューン
          s = Math.sin(2 * Math.PI * freq * t) * 0.5;
          s += Math.sin(2 * Math.PI * freq * 1.003 * t) * 0.3; // slight detune
          s += Math.sin(2 * Math.PI * freq * 0.997 * t) * 0.3;
          s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.15; // octave
        } else if (style === "pluck") {
          // 短いアタックのプラック音 + 持続パッド
          const pluckEnv = Math.exp(-t * 3);
          s = Math.sin(2 * Math.PI * freq * t) * (0.3 + pluckEnv * 0.4);
          s += Math.sin(2 * Math.PI * freq * 2 * t) * pluckEnv * 0.2;
        } else {
          // warm: 柔らかいサイン波
          s = Math.sin(2 * Math.PI * freq * t) * 0.6;
          s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
          s += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.1;
        }

        const vol = env * 0.04;
        left[idx] += s * vol;
        right[idx] += s * vol;
      }
    }
  }

  // ===== Layer 2: アルペジオ =====
  const arpSubdiv = 2; // 1ビートあたり2音
  for (let beat = 0; beat < totalBeats; beat++) {
    const chord = getChordAt(beat);
    for (let sub = 0; sub < arpSubdiv; sub++) {
      const arpIdx = (beat * arpSubdiv + sub) % arpPattern.length;
      const noteIdx = arpPattern[arpIdx] % chord.notes.length;
      const note = chord.notes[noteIdx];
      const freq = N[note] || 440;

      const startT = (beat + sub / arpSubdiv) * beatSec;
      const noteDur = beatSec / arpSubdiv * 0.8;
      const startSample = Math.floor(startT * sampleRate);
      const durSamples = Math.floor(noteDur * sampleRate);

      for (let i = 0; i < durSamples; i++) {
        const idx = startSample + i;
        if (idx >= totalSamples) break;
        const t = i / sampleRate;

        const attack = Math.min(1, t / 0.01);
        const decay = Math.exp(-t * 8);
        const env = attack * decay;

        // ベルライクなプラック音
        let s = Math.sin(2 * Math.PI * freq * t);
        s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.5 * Math.exp(-t * 12);
        s += Math.sin(2 * Math.PI * freq * 3 * t) * 0.2 * Math.exp(-t * 15);

        // ステレオ広がり
        const pan = 0.3 * Math.sin(beat * 0.7 + sub);
        const vol = env * 0.035;
        left[idx] += s * vol * (1 - pan);
        right[idx] += s * vol * (1 + pan);
      }
    }
  }

  // ===== Layer 3: ベースライン =====
  for (const chord of chords) {
    const freq = N[chord.bass] || 130;
    const startSample = Math.floor(chord.start * beatSec * sampleRate);
    const durSamples = Math.floor(chord.dur * beatSec * sampleRate);

    for (let i = 0; i < durSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / sampleRate;

      const attack = Math.min(1, t / 0.15);
      const release = Math.min(1, (durSamples / sampleRate - t) / 0.5);
      const env = attack * release;

      // サブベース + 倍音
      let s = Math.sin(2 * Math.PI * freq * t) * 0.7;
      s += Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
      s += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.3; // sub octave

      const vol = env * 0.06;
      left[idx] += s * vol;
      right[idx] += s * vol;
    }
  }

  // ===== シンプルリバーブ（コムフィルター）=====
  const delayMs = [37, 53, 71, 97]; // ms
  const feedback = 0.25;
  for (const ms of delayMs) {
    const delaySamples = Math.floor(ms * sampleRate / 1000);
    for (let i = delaySamples; i < totalSamples; i++) {
      left[i] += left[i - delaySamples] * feedback;
      right[i] += right[i - delaySamples] * feedback;
    }
  }

  // ===== グローバルダイナミクス =====
  // フェードイン（1秒）+ クレッシェンド + フェードアウト（2秒）
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // フェードイン
    const fadeIn = Math.min(1, t / 1.0);
    // クレッシェンド（15秒でピーク、その後維持）
    const crescendo = 0.6 + 0.4 * Math.min(1, t / 15);
    // フェードアウト
    const fadeOut = t > duration - 2 ? Math.max(0, (duration - t) / 2) : 1;
    // クリッピング防止
    const master = fadeIn * crescendo * fadeOut;
    left[i] = Math.max(-1, Math.min(1, left[i] * master));
    right[i] = Math.max(-1, Math.min(1, right[i] * master));
  }

  // WAV変換
  const audioCtx = new AudioContext({ sampleRate });
  const buffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
  buffer.getChannelData(0).set(left);
  buffer.getChannelData(1).set(right);
  const wavBlob = audioBufferToWav(buffer);
  await audioCtx.close();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(wavBlob);
  });
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const v = new DataView(ab);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + dataSize, true); w(8, "WAVE");
  w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * blockAlign, true); v.setUint16(32, blockAlign, true);
  v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, dataSize, true);
  const chs = [buffer.getChannelData(0), buffer.getChannelData(1)];
  let off = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, chs[ch][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
