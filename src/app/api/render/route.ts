import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const props = await request.json();
    const { templateId = "quote-card", durationInFrames = 900, fps = 30, ...inputProps } = props;

    const tmpDir = os.tmpdir();
    const propsPath = path.join(tmpDir, `remotion-props-${Date.now()}.json`);
    const outputPath = path.join(tmpDir, `render-${Date.now()}.mp4`);
    const projectRoot = process.cwd();
    const entryPoint = path.join(projectRoot, "src", "remotion", "index.ts");

    // propsをJSONファイルに書き出し
    fs.writeFileSync(propsPath, JSON.stringify(inputProps));

    console.log("[Render] Starting CLI render:", templateId);

    // Remotion CLI でレンダリング
    const cmd = [
      "npx", "remotion", "render",
      entryPoint,
      templateId,
      outputPath,
      "--props", propsPath,
      "--codec", "h264",
      "--width", "1080",
      "--height", "1920",
      "--fps", String(fps),
      "--frames", `0-${durationInFrames - 1}`,
      "--concurrency", "2",
      "--log", "error",
    ].join(" ");

    execSync(cmd, {
      cwd: projectRoot,
      stdio: "pipe",
      timeout: 240000, // 4分タイムアウト
      env: {
        ...process.env,
        NODE_OPTIONS: "",
        // Docker/Railway環境ではChromiumパスを指定
        ...(process.env.CHROMIUM_PATH ? { PUPPETEER_EXECUTABLE_PATH: process.env.CHROMIUM_PATH } : {}),
      },
    });

    // クリーンアップ
    if (fs.existsSync(propsPath)) fs.unlinkSync(propsPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error("レンダリング出力ファイルが見つかりません");
    }

    console.log("[Render] Done, reading output...");
    const videoBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="seminar-reel.mp4"`,
        "Content-Length": videoBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[Render] Error:", error);
    const message = error instanceof Error ? error.message : "レンダリング失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
