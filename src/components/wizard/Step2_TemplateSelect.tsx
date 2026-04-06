"use client";

import { Player } from "@remotion/player";
import type { VideoState, TemplateId } from "@/lib/types";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { QuoteCard } from "@/components/video/templates/QuoteCard";
import { KineticText } from "@/components/video/templates/KineticText";
import { GradientFadeIn } from "@/components/video/templates/GradientFadeIn";
import { MinimalZen } from "@/components/video/templates/MinimalZen";
import { StorySlides } from "@/components/video/templates/StorySlides";
import type { Dispatch } from "react";

type Action =
  | { type: "SET_TEMPLATE"; payload: TemplateId }
  | { type: "SET_PRIMARY_COLOR"; payload: string }
  | { type: "SET_ACCENT_COLOR"; payload: string };

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
};

function getTemplateComponent(id: TemplateId) {
  switch (id) {
    case "quote-card":
      return QuoteCard;
    case "kinetic-text":
      return KineticText;
    case "gradient-fadein":
      return GradientFadeIn;
    case "minimal-zen":
      return MinimalZen;
    case "story-slides":
      return StorySlides;
    default:
      return QuoteCard;
  }
}

export function Step2_TemplateSelect({ state, dispatch }: Props) {
  const currentTemplate = getTemplate(state.selectedTemplate);
  const TemplateComponent = getTemplateComponent(state.selectedTemplate);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* テンプレート一覧 */}
      <div>
        <h3 className="text-sm font-medium mb-3">テンプレートを選択</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => dispatch({ type: "SET_TEMPLATE", payload: t.id })}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                state.selectedTemplate === t.id
                  ? "border-amber-700 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className="w-full aspect-[9/16] rounded-lg mb-2"
                style={{
                  background: `linear-gradient(135deg, ${t.defaultPrimaryColor}, ${t.defaultPrimaryColor}99)`,
                }}
              />
              <p className="text-xs font-medium">{t.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* プレビュー */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 flex justify-center">
          <div className="w-[270px] aspect-[9/16] rounded-2xl overflow-hidden shadow-xl">
            <Player
              component={TemplateComponent}
              inputProps={{
                quoteText: state.quoteText || "ここに名言が表示されます",
                speakerName: state.speakerName,
                contextLine: state.contextLine,
                backgroundImage: state.backgroundImage,
                primaryColor: state.primaryColor,
                accentColor: state.accentColor,
              }}
              durationInFrames={currentTemplate?.durationInFrames ?? 240}
              fps={currentTemplate?.fps ?? 30}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%" }}
              autoPlay
              loop
            />
          </div>
        </div>

        {/* カラー設定 */}
        <div className="space-y-4 w-full md:w-60">
          <div>
            <label className="block text-sm font-medium mb-2">
              メインカラー
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={state.primaryColor}
                onChange={(e) =>
                  dispatch({
                    type: "SET_PRIMARY_COLOR",
                    payload: e.target.value,
                  })
                }
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">
                {state.primaryColor}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              アクセントカラー
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={state.accentColor}
                onChange={(e) =>
                  dispatch({
                    type: "SET_ACCENT_COLOR",
                    payload: e.target.value,
                  })
                }
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500">
                {state.accentColor}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {currentTemplate?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
