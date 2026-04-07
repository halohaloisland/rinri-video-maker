import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";

// 利用可能なボイス一覧
const VOICES = {
  "Kore": "女性・落ち着いた声",
  "Aoede": "女性・明るい声",
  "Charon": "男性・低め落ち着いた声",
  "Fenrir": "男性・力強い声",
  "Puck": "男性・親しみやすい声",
};

export async function POST(request: Request) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
    return NextResponse.json(
      { error: "GOOGLE_GEMINI_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  try {
    const { text, voice = "Kore" } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "テキストが空です" },
        { status: 400 }
      );
    }

    // テキストが長すぎる場合は切る（TTS のトークン制限）
    const truncatedText = text.slice(0, 2000);

    // Gemini TTS API を直接呼び出す
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Read the following Japanese text aloud naturally: ${truncatedText}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice,
              },
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "TTS API error");
    }

    // 音声データを抽出
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error("音声が生成されませんでした");
    }

    const audioPart = parts.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );
    if (!audioPart) {
      throw new Error("音声データが見つかりません");
    }

    const { mimeType, data: audioBase64 } = audioPart.inlineData;

    // PCM → WAV に変換（ブラウザで再生可能にするため）
    const pcmBuffer = Buffer.from(audioBase64, "base64");
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString("base64");

    return NextResponse.json({
      audio: `data:audio/wav;base64,${wavBase64}`,
      mimeType: "audio/wav",
      originalMimeType: mimeType,
      voice,
      voiceDescription: VOICES[voice as keyof typeof VOICES] || voice,
    });
  } catch (error) {
    console.error("TTS error:", error);
    const message =
      error instanceof Error ? error.message : "音声生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ボイス一覧を返すGET エンドポイント
export async function GET() {
  return NextResponse.json({
    voices: Object.entries(VOICES).map(([id, description]) => ({
      id,
      description,
    })),
  });
}

/**
 * Raw PCM (L16) → WAV 変換
 */
function pcmToWav(
  pcmData: Buffer,
  sampleRate: number,
  channels: number,
  bitDepth: number
): Buffer {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const dataSize = pcmData.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = Buffer.alloc(totalSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(totalSize - 8, 4);
  buffer.write("WAVE", 8);

  // fmt chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);

  // data chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmData.copy(buffer, 44);

  return buffer;
}
