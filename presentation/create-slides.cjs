const pptxgen = require("pptxgenjs");
const pres = new pptxgen();

pres.layout = "LAYOUT_16x9";
pres.author = "Yuichi Yamamoto";
pres.title = "AIと一緒にアプリを作ってみた話";

// Color palette: Warm Amber theme
const C = {
  dark: "1A1A2E",
  primary: "B85C38",
  accent: "E8B04A",
  light: "F5F0EB",
  white: "FFFFFF",
  text: "2D2D2D",
  muted: "888888",
  green: "2E7D32",
  blue: "1565C0",
};

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

// ======== Slide 1: Title ========
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  // Large accent shape
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.accent } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.545, w: 10, h: 0.08, fill: { color: C.accent } });
  // Title
  s.addText("AIと一緒に\nアプリを作ってみた話", {
    x: 0.8, y: 0.8, w: 8.4, h: 2.5, fontSize: 44, fontFace: "Georgia",
    color: C.white, bold: true, lineSpacingMultiple: 1.3, align: "left", margin: 0,
  });
  // Subtitle
  s.addText("セミナー音声 → Instagramリール動画 自動生成アプリ", {
    x: 0.8, y: 3.3, w: 8.4, h: 0.8, fontSize: 20, fontFace: "Calibri",
    color: C.accent, align: "left", margin: 0,
  });
  // Author
  s.addText("AI勉強会  |  山本 雄一", {
    x: 0.8, y: 4.5, w: 8.4, h: 0.6, fontSize: 16, fontFace: "Calibri",
    color: C.muted, align: "left", margin: 0,
  });
  s.addNotes("今日はですね、AIを使ってアプリを作ってみた体験をシェアします。プログラミングの知識？ゼロです！（笑）でもAIと会話するだけで、ちゃんと動くWebアプリが完成しました。その一部始終をお話しします。");
}

// ======== Slide 2: Problem ========
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  s.addText("こんな悩みありませんか？", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.8, fontSize: 36, fontFace: "Georgia",
    color: C.text, bold: true, margin: 0,
  });
  const problems = [
    { icon: "😩", text: "セミナーの良い話を広めたいけど、動画編集は面倒…" },
    { icon: "🤔", text: "Instagramリールが効果的らしいけど、作り方わからん…" },
    { icon: "😤", text: "毎回同じ作業の繰り返し…自動化したい！" },
  ];
  problems.forEach((p, i) => {
    const y = 1.6 + i * 1.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y, w: 8.4, h: 0.95, fill: { color: C.white }, rectRadius: 0.1, shadow: makeShadow(),
    });
    s.addText(p.icon, { x: 1.1, y, w: 0.7, h: 0.95, fontSize: 32, align: "center", valign: "middle", margin: 0 });
    s.addText(p.text, { x: 1.9, y, w: 7, h: 0.95, fontSize: 20, fontFace: "Calibri", color: C.text, valign: "middle", margin: 0 });
  });
  s.addNotes("モーニングセミナーで素晴らしい話を聞くじゃないですか。でもそれをリール動画にしようとすると、まあ大変。テキスト考えて、画像選んで、編集して…。これ、AIにやらせればいいんじゃない？って思ったわけです。");
}

// ======== Slide 3: AI Tools ========
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addText("登場人物（AI）紹介", {
    x: 0.8, y: 0.4, w: 8.4, h: 0.8, fontSize: 36, fontFace: "Georgia",
    color: C.text, bold: true, margin: 0,
  });
  const tools = [
    { emoji: "🤖", name: "Claude Code", role: "アプリ全体を開発してくれた相棒", color: C.primary },
    { emoji: "✨", name: "Google Gemini", role: "音声の文字起こし＆要約担当", color: C.blue },
    { emoji: "🎙️", name: "Gemini TTS", role: "ナレーション音声の自動生成", color: C.green },
  ];
  tools.forEach((t, i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.5, w: 2.9, h: 3.3, fill: { color: C.light }, rectRadius: 0.15, shadow: makeShadow(),
    });
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.85, y: 1.8, w: 1.2, h: 1.2, fill: { color: t.color },
    });
    s.addText(t.emoji, { x: x + 0.85, y: 1.8, w: 1.2, h: 1.2, fontSize: 36, align: "center", valign: "middle", margin: 0 });
    s.addText(t.name, { x, y: 3.2, w: 2.9, h: 0.6, fontSize: 18, fontFace: "Calibri", color: C.text, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(t.role, { x, y: 3.8, w: 2.9, h: 0.8, fontSize: 14, fontFace: "Calibri", color: C.muted, align: "center", valign: "top", margin: [0, 0.2, 0, 0.2] });
  });
  s.addNotes("今回の主役はClaude Codeです。こいつがすごい。「こういうアプリ作りたい」って言ったら、コード書いて、デバッグして、デプロイまでやってくれる。僕はずっと横で「ここ直して」「あれも追加して」って言ってただけです（笑）");
}

// ======== Slide 4: Development Flow ========
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addText("AIとの会話だけでアプリが完成", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.8, fontSize: 34, fontFace: "Georgia",
    color: C.white, bold: true, margin: 0,
  });
  const steps = [
    { req: "リール動画を簡単に作りたい", result: "基本設計" },
    { req: "音声アップでAI要約して", result: "Gemini連携" },
    { req: "写真も入れたい", result: "スライドショー" },
    { req: "BGMも欲しい", result: "5曲プリセット" },
    { req: "スマホでも使いたい", result: "モバイル対応" },
    { req: "みんなに共有したい", result: "Vercelデプロイ" },
  ];
  steps.forEach((st, i) => {
    const y = 1.3 + i * 0.65;
    // Number circle
    s.addShape(pres.shapes.OVAL, { x: 0.8, y: y + 0.05, w: 0.45, h: 0.45, fill: { color: C.accent } });
    s.addText(`${i + 1}`, { x: 0.8, y: y + 0.05, w: 0.45, h: 0.45, fontSize: 16, color: C.dark, bold: true, align: "center", valign: "middle", margin: 0 });
    // Request
    s.addText(`「${st.req}」`, { x: 1.5, y, w: 5.2, h: 0.55, fontSize: 17, fontFace: "Calibri", color: C.white, valign: "middle", margin: 0 });
    // Arrow
    s.addText("→", { x: 6.7, y, w: 0.5, h: 0.55, fontSize: 20, color: C.accent, align: "center", valign: "middle", margin: 0 });
    // Result
    s.addText(st.result, { x: 7.3, y, w: 2.2, h: 0.55, fontSize: 17, fontFace: "Calibri", color: C.accent, bold: true, valign: "middle", margin: 0 });
  });
  s.addText("開発期間：約1日（数時間の会話）", {
    x: 0.8, y: 5, w: 8.4, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.muted, align: "center", margin: 0,
  });
  s.addNotes("開発期間？1日です。正確に言うと数時間。AIに「あれやって、これやって」って言い続けただけ。途中でエラーが出ても「エラー出たよ」ってスクショ送ったら直してくれる。もう人間のエンジニアいらないんじゃ…（冗談です）");
}

// ======== Slide 5: Features ========
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  s.addText("できること一覧", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.8, fontSize: 36, fontFace: "Georgia",
    color: C.text, bold: true, margin: 0,
  });
  const features = [
    "セミナー音声をアップ → AIが自動要約",
    "5つのテキスト案から選べる",
    "ナレーション台本も自動生成",
    "写真2〜3枚でスライドショー",
    "AI音声でナレーション自動生成",
    "BGM 5曲から選べる",
    "タイトル・エンディングもカスタマイズ",
    "スマホでもPCでも使える",
  ];
  features.forEach((f, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const x = 0.8 + col * 4.5;
    const y = 1.3 + row * 0.95;
    s.addShape(pres.shapes.OVAL, { x, y: y + 0.1, w: 0.4, h: 0.4, fill: { color: C.green } });
    s.addText("✓", { x, y: y + 0.1, w: 0.4, h: 0.4, fontSize: 16, color: C.white, align: "center", valign: "middle", margin: 0 });
    s.addText(f, { x: x + 0.55, y, w: 3.8, h: 0.6, fontSize: 16, fontFace: "Calibri", color: C.text, valign: "middle", margin: 0 });
  });
  s.addNotes("機能てんこ盛りですけど、使う人がやることは3つだけ。音声アップロード、写真アップロード、あとはAIにお任せ。簡単でしょ？");
}

// ======== Slide 6: Pricing ========
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  s.addText("気になるお値段は…", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.8, fontSize: 36, fontFace: "Georgia",
    color: C.text, bold: true, margin: 0,
  });
  const items = [
    { label: "アプリ本体（Vercel）", price: "無料" },
    { label: "AI要約（Gemini API）", price: "無料" },
    { label: "AI音声（Gemini TTS）", price: "無料" },
  ];
  items.forEach((it, i) => {
    const y = 1.5 + i * 0.85;
    s.addText(it.label, { x: 1.5, y, w: 4.5, h: 0.65, fontSize: 20, fontFace: "Calibri", color: C.text, valign: "middle", margin: 0 });
    s.addText(it.price, { x: 6.5, y, w: 2, h: 0.65, fontSize: 22, fontFace: "Calibri", color: C.green, bold: true, align: "center", valign: "middle", margin: 0 });
  });
  // Big FREE callout
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 2.5, y: 4, w: 5, h: 1.2, fill: { color: C.primary }, rectRadius: 0.15, shadow: makeShadow(),
  });
  s.addText("全部無料！！！", {
    x: 2.5, y: 4, w: 5, h: 1.2, fontSize: 40, fontFace: "Georgia",
    color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
  });
  s.addNotes("はい、全部無料です。Googleさんありがとう。ただし、みんなで同時にガンガン使うとAIが「ちょっと待って！」って言うことがあります。その時は数秒待ってください。Google先生は気前がいいんですけど、同時に何十人もアクセスすると「ちょっと！順番！」って怒られます（笑）");
}

// ======== Slide 7: Usage Step 1-2 ========
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  s.addText("使い方：前半", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.8, fontSize: 34, fontFace: "Georgia",
    color: C.text, bold: true, margin: 0,
  });
  // Step 1
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.3, w: 4.2, h: 3.5, fill: { color: C.white }, rectRadius: 0.12, shadow: makeShadow() });
  s.addShape(pres.shapes.OVAL, { x: 1, y: 1.5, w: 0.6, h: 0.6, fill: { color: C.primary } });
  s.addText("1", { x: 1, y: 1.5, w: 0.6, h: 0.6, fontSize: 22, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("音声アップロード", { x: 1.8, y: 1.5, w: 2.8, h: 0.6, fontSize: 20, fontFace: "Calibri", color: C.text, bold: true, valign: "middle", margin: 0 });
  s.addText([
    { text: "🎤 セミナーの録音ファイルを選択", options: { breakLine: true, fontSize: 15 } },
    { text: "✨ 「AIで要約する」ボタンを押す", options: { breakLine: true, fontSize: 15 } },
    { text: "📝 5つのテキスト案が自動生成！", options: { fontSize: 15 } },
  ], { x: 1, y: 2.4, w: 3.5, h: 2, fontFace: "Calibri", color: C.text, lineSpacingMultiple: 1.8 });

  // Step 2
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 1.3, w: 4.2, h: 3.5, fill: { color: C.white }, rectRadius: 0.12, shadow: makeShadow() });
  s.addShape(pres.shapes.OVAL, { x: 5.6, y: 1.5, w: 0.6, h: 0.6, fill: { color: C.primary } });
  s.addText("2", { x: 5.6, y: 1.5, w: 0.6, h: 0.6, fontSize: 22, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("テキスト選択＆編集", { x: 6.4, y: 1.5, w: 2.8, h: 0.6, fontSize: 20, fontFace: "Calibri", color: C.text, bold: true, valign: "middle", margin: 0 });
  s.addText([
    { text: "📋 気に入った案をタップで選択", options: { breakLine: true, fontSize: 15 } },
    { text: "✏️ テキストを自由に編集OK", options: { breakLine: true, fontSize: 15 } },
    { text: "📌 タイトル・講師名も設定", options: { fontSize: 15 } },
  ], { x: 5.6, y: 2.4, w: 3.5, h: 2, fontFace: "Calibri", color: C.text, lineSpacingMultiple: 1.8 });
  s.addNotes("では実際の使い方を説明します。まずセミナーの録音ファイルをアップロード。するとAIが頑張って分析して、5つのテキスト案を出してくれます。気に入ったのを選んで、必要なら編集。タイトルも自由に付けられます。手動入力もできますよ。");
}

// ======== Slide 8: Usage Step 3-4 ========
{
  const s = pres.addSlide();
  s.background = { color: C.light };
  s.addText("使い方：中盤", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.8, fontSize: 34, fontFace: "Georgia",
    color: C.text, bold: true, margin: 0,
  });
  // Step 3
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.3, w: 4.2, h: 3.5, fill: { color: C.white }, rectRadius: 0.12, shadow: makeShadow() });
  s.addShape(pres.shapes.OVAL, { x: 1, y: 1.5, w: 0.6, h: 0.6, fill: { color: C.primary } });
  s.addText("3", { x: 1, y: 1.5, w: 0.6, h: 0.6, fontSize: 22, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("写真アップロード", { x: 1.8, y: 1.5, w: 2.8, h: 0.6, fontSize: 20, fontFace: "Calibri", color: C.text, bold: true, valign: "middle", margin: 0 });
  s.addText([
    { text: "📷 セミナー写真を2〜3枚選択", options: { breakLine: true, fontSize: 15 } },
    { text: "🔄 順番の並び替えもOK", options: { breakLine: true, fontSize: 15 } },
    { text: "🎬 エンディング画像も設定可能", options: { fontSize: 15 } },
  ], { x: 1, y: 2.4, w: 3.5, h: 2, fontFace: "Calibri", color: C.text, lineSpacingMultiple: 1.8 });

  // Step 4
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 1.3, w: 4.2, h: 3.5, fill: { color: C.white }, rectRadius: 0.12, shadow: makeShadow() });
  s.addShape(pres.shapes.OVAL, { x: 5.6, y: 1.5, w: 0.6, h: 0.6, fill: { color: C.primary } });
  s.addText("4", { x: 5.6, y: 1.5, w: 0.6, h: 0.6, fontSize: 22, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("テンプレ＆BGM", { x: 6.4, y: 1.5, w: 2.8, h: 0.6, fontSize: 20, fontFace: "Calibri", color: C.text, bold: true, valign: "middle", margin: 0 });
  s.addText([
    { text: "🎨 5種類のテンプレートから選択", options: { breakLine: true, fontSize: 15 } },
    { text: "🎵 BGM 5曲プレビュー付き", options: { breakLine: true, fontSize: 15 } },
    { text: "🎨 色も自由にカスタマイズ", options: { fontSize: 15 } },
  ], { x: 5.6, y: 2.4, w: 3.5, h: 2, fontFace: "Calibri", color: C.text, lineSpacingMultiple: 1.8 });
  s.addNotes("次に写真。セミナー中に撮った写真を2〜3枚入れると、スライドショーになります。エンディング用の画像も設定できます。「フォローお願いします！」みたいなテキストも入れられます。テンプレートは5種類、BGMも5曲から選べて、色も自由にカスタマイズできます。");
}

// ======== Slide 9: Usage Step 5 ========
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addText("使い方：仕上げ", {
    x: 0.8, y: 0.3, w: 8.4, h: 0.8, fontSize: 34, fontFace: "Georgia",
    color: C.white, bold: true, margin: 0,
  });
  s.addShape(pres.shapes.OVAL, { x: 0.8, y: 1.3, w: 0.6, h: 0.6, fill: { color: C.accent } });
  s.addText("5", { x: 0.8, y: 1.3, w: 0.6, h: 0.6, fontSize: 22, color: C.dark, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("ナレーション＆完成！", { x: 1.6, y: 1.3, w: 7, h: 0.6, fontSize: 24, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });

  const methods = [
    { icon: "🤖", label: "方法1", text: "AI音声で自動生成（おすすめ）" },
    { icon: "🎤", label: "方法2", text: "自分の声でブラウザ録音" },
    { icon: "📁", label: "方法3", text: "録音済みファイルをアップロード" },
  ];
  methods.forEach((m, i) => {
    const y = 2.2 + i * 0.8;
    s.addText(`${m.icon}  ${m.label}: ${m.text}`, {
      x: 1.2, y, w: 7.5, h: 0.65, fontSize: 18, fontFace: "Calibri", color: C.white, valign: "middle", margin: 0,
    });
  });

  // Final flow
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1, y: 4.3, w: 8, h: 0.9, fill: { color: C.primary }, rectRadius: 0.1 });
  s.addText("▶️ フルスクリーン再生  →  📱 画面録画  →  📸 Instagramに投稿！", {
    x: 1, y: 4.3, w: 8, h: 0.9, fontSize: 18, fontFace: "Calibri",
    color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
  });
  s.addNotes("最後にナレーション。AI音声なら台本からワンクリックで生成。自分の声を入れたい人はブラウザで録音もできます。できあがったら「フルスクリーンで再生」ボタンを押して、スマホの画面録画で撮影。それをそのままInstagramにアップすればリール完成！めちゃ簡単でしょ？");
}

// ======== Slide 10: URL ========
{
  const s = pres.addSlide();
  s.background = { color: C.primary };
  s.addText("今すぐ使えます！", {
    x: 0.8, y: 0.5, w: 8.4, h: 1, fontSize: 40, fontFace: "Georgia",
    color: C.white, bold: true, align: "center", margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 1.5, y: 1.8, w: 7, h: 1.5, fill: { color: C.white }, rectRadius: 0.15, shadow: makeShadow(),
  });
  s.addText("rinri-video-maker.vercel.app", {
    x: 1.5, y: 1.8, w: 7, h: 1.5, fontSize: 30, fontFace: "Consolas",
    color: C.primary, bold: true, align: "center", valign: "middle", margin: 0,
  });
  const points = [
    "📱 スマホでもPCでもOK",
    "⚡ インストール不要",
    "🌐 ブラウザで開くだけ",
  ];
  points.forEach((p, i) => {
    s.addText(p, {
      x: 2, y: 3.7 + i * 0.55, w: 6, h: 0.5, fontSize: 20, fontFace: "Calibri",
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
  });
  s.addNotes("URLはこちらです。スマホのブラウザに直接入力してください。今この場で試してもらっても大丈夫です！みなさん、スマホ出してください（笑）");
}

// ======== Slide 11: Summary ========
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.accent } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.545, w: 10, h: 0.08, fill: { color: C.accent } });
  s.addText("AIで誰でも\nクリエイターになれる時代", {
    x: 0.8, y: 0.5, w: 8.4, h: 2, fontSize: 40, fontFace: "Georgia",
    color: C.white, bold: true, lineSpacingMultiple: 1.3, margin: 0,
  });
  const takeaways = [
    "💡 プログラミング知識なしでもアプリが作れた",
    "🔧 AIは道具。使い方次第で可能性は無限大",
    "🌏 セミナーの素晴らしい教えを、もっと多くの人に届けよう",
  ];
  takeaways.forEach((t, i) => {
    s.addText(t, {
      x: 1.2, y: 2.8 + i * 0.7, w: 7.5, h: 0.6, fontSize: 20, fontFace: "Calibri",
      color: C.white, valign: "middle", margin: 0,
    });
  });
  s.addText("ご清聴ありがとうございました！", {
    x: 0.8, y: 4.8, w: 8.4, h: 0.5, fontSize: 18, fontFace: "Calibri",
    color: C.accent, align: "center", margin: 0,
  });
  s.addNotes("まとめです。今回の体験で感じたのは、もうAIがあればアイデアさえあれば何でも作れるということ。プログラミングできなくても、デザインセンスなくても、AIが全部やってくれる。大事なのは「こういうものが欲しい」というビジョンです。セミナーの素晴らしい教えを、リール動画でもっと多くの人に届けていきましょう！ご清聴ありがとうございました！");
}

const outputPath = "/Users/yamamotoyuuichi/Library/CloudStorage/GoogleDrive-halohaloisland@gmail.com/マイドライブ/AI勉強会/rinri-video-maker/presentation/AI勉強会発表スライド.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log(`Created: ${outputPath}`);
}).catch((err) => {
  console.error("Error:", err);
});
