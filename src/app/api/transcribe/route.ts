import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";

// Vercelのbodyサイズ制限を拡大（50MB）
export const maxDuration = 120; // 2分タイムアウト

export async function POST(request: Request) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
    return NextResponse.json(
      { error: "GOOGLE_GEMINI_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  let tmpFilePath: string | null = null;

  try {
    // FormDataで受け取る（大きなファイル対応）
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const mimeType = (formData.get("mimeType") as string) || "audio/mp3";

    if (!audioFile) {
      return NextResponse.json({ error: "音声ファイルが提供されていません" }, { status: 400 });
    }

    // 一時ファイルに保存
    const ext = mimeType.split("/")[1]?.replace("x-", "") || "mp3";
    tmpFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.${ext}`);
    const arrayBuffer = await audioFile.arrayBuffer();
    fs.writeFileSync(tmpFilePath, Buffer.from(arrayBuffer));

    // Gemini File APIでアップロード
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
    const uploadResult = await fileManager.uploadFile(tmpFilePath, {
      mimeType,
      displayName: audioFile.name || "seminar-audio",
    });

    console.log("[Transcribe] File uploaded:", uploadResult.file.uri);

    // Gemini で文字起こし＆要約
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
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

    const responseText = result.response.text();

    // JSONを抽出
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // アップロードしたファイルを削除（クリーンアップ）
    try {
      await fileManager.deleteFile(uploadResult.file.name);
    } catch { /* ignore cleanup errors */ }

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
  } finally {
    // 一時ファイルのクリーンアップ
    if (tmpFilePath && fs.existsSync(tmpFilePath)) {
      try { fs.unlinkSync(tmpFilePath); } catch { /* ignore */ }
    }
  }
}
