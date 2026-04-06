import type { TemplateMetadata } from "./types";

export const TEMPLATES: TemplateMetadata[] = [
  {
    id: "quote-card",
    name: "名言カード",
    description: "背景にテキストがフェードイン。写真対応",
    durationInFrames: 900, // 30秒 @ 30fps
    fps: 30,
    defaultPrimaryColor: "#1e3a5f",
    defaultAccentColor: "#e8b04a",
  },
  {
    id: "kinetic-text",
    name: "キネティックテキスト",
    description: "単語が1つずつバネアニメーション。写真対応",
    durationInFrames: 900, // 30秒
    fps: 30,
    defaultPrimaryColor: "#2d1b69",
    defaultAccentColor: "#ff6b6b",
  },
  {
    id: "gradient-fadein",
    name: "グラデーション・フェードイン",
    description: "グラデーション背景＋行ごとのフェードイン。写真対応",
    durationInFrames: 900, // 30秒
    fps: 30,
    defaultPrimaryColor: "#0f2027",
    defaultAccentColor: "#2c5364",
  },
  {
    id: "minimal-zen",
    name: "和風ミニマル",
    description: "白背景＋縦線装飾。落ち着いた和の雰囲気。写真対応",
    durationInFrames: 900, // 30秒
    fps: 30,
    defaultPrimaryColor: "#2c2c2c",
    defaultAccentColor: "#c4956a",
  },
  {
    id: "story-slides",
    name: "ストーリースライド",
    description: "写真スライドショー＋名言。写真対応",
    durationInFrames: 900, // 30秒
    fps: 30,
    defaultPrimaryColor: "#1a1a2e",
    defaultAccentColor: "#e94560",
  },
];

export function getTemplate(id: string): TemplateMetadata | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
