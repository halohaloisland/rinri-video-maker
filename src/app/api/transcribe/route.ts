import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";

export async function POST(request: Request) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
    return NextResponse.json(
      { error: "GOOGLE_GEMINI_API_KEY が設定されていません。.env.local を確認してください。" },
      { status: 500 }
    );
  }

  try {
    const { audioBase64, mimeType } = await request.json();

    if (!audioBase64) {
      return NextResponse.json(
        { error: "音声データが提供されていません" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Step 1: 音声の文字起こしと要約
    const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, "");

    const transcribeResult = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "audio/mp3",
          data: base64Data,
        },
      },
      {
        text: `この音声はセミナー（倫理法人会モーニングセミナーなど）の録音です。
以下の作業を行ってください：

1. 音声を文字起こししてください
2. 内容を分析し、核心となるメッセージ・名言・教訓を抽出してください
3. Instagramリール動画用に以下のJSON形式で5つのテキスト案を生成してください

各案には:
- label: 案の特徴（例: "インパクト重視", "感動路線", "学び重視" など）
- displayText: 動画に表示するテキスト（30〜80文字、キャッチーで心に響く短い文）
- narrationScript: ナレーション台本（100〜200文字、30秒で読める長さ。セミナーの要点を分かりやすく伝える文章）

以下のJSON形式で出力してください（JSONのみ、説明なし）:
{
  "transcript": "文字起こし全文（要約でOK、500文字以内）",
  "suggestions": [
    {
      "label": "案の特徴",
      "displayText": "表示テキスト",
      "narrationScript": "ナレーション台本"
    }
  ]
}`,
      },
    ]);

    const responseText = transcribeResult.response.text();

    // JSONを抽出（マークダウンのコードブロック内にある場合も対応）
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      transcript: parsed.transcript || "",
      suggestions: (parsed.suggestions || []).map(
        (s: { label?: string; displayText?: string; narrationScript?: string }) => ({
          label: s.label || "",
          displayText: s.displayText || "",
          narrationScript: s.narrationScript || "",
        })
      ),
    });
  } catch (error) {
    console.error("Transcribe API error:", error);
    const message = error instanceof Error ? error.message : "処理に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
