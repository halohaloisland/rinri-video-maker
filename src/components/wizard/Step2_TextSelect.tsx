"use client";

import type { VideoState } from "@/lib/types";
import type { Dispatch } from "react";
import type { Action } from "@/hooks/useVideoState";

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
};

export function Step2_TextSelect({ state, dispatch }: Props) {
  const hasAISuggestions = state.textSuggestions.length > 0;
  const isManual = state.manualMode || !hasAISuggestions;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {isManual ? "テキストを入力" : "テキスト案を選択"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isManual
            ? "動画に表示するテキストとナレーション台本を入力してください"
            : "AIが生成した案から1つ選び、必要に応じて編集できます"}
        </p>
      </div>

      {/* AI生成テキスト案カード */}
      {hasAISuggestions && !state.manualMode && (
        <div className="space-y-3">
          {state.textSuggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => dispatch({ type: "SELECT_SUGGESTION", payload: idx })}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                state.selectedSuggestionIndex === idx
                  ? "border-amber-500 bg-amber-50 shadow-md"
                  : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    state.selectedSuggestionIndex === idx
                      ? "bg-amber-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-700 font-medium mb-1">
                    {suggestion.label}
                  </p>
                  <p className="text-base font-semibold text-gray-800 mb-2">
                    {suggestion.displayText}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">📝 ナレーション台本:</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {suggestion.narrationScript}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => dispatch({ type: "SET_MANUAL_MODE", payload: true })}
            className="text-sm text-gray-400 hover:text-amber-700 underline"
          >
            手動で入力する
          </button>
        </div>
      )}

      {/* 選択後 or 手動入力の編集フォーム */}
      {(state.selectedSuggestionIndex >= 0 || isManual) && (
        <div className="space-y-5 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-600">
            {isManual ? "テキスト入力" : "選択したテキストを編集"}
          </h3>

          {/* タイトル */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              📌 タイトル（動画冒頭に表示）
            </label>
            <input
              type="text"
              value={state.titleText}
              onChange={(e) =>
                dispatch({ type: "SET_TITLE", payload: e.target.value })
              }
              placeholder="例: 今日の学び / 人生を変える一言"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-lg"
              maxLength={50}
            />
            <div className="flex gap-4">
              {/* フォントサイズ */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  サイズ: {state.titleFontSize}px
                </label>
                <input
                  type="range"
                  min="24"
                  max="80"
                  value={state.titleFontSize}
                  onChange={(e) =>
                    dispatch({ type: "SET_TITLE_FONT_SIZE", payload: Number(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>
              {/* フォント選択 */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">フォント</label>
                <select
                  value={state.titleFont}
                  onChange={(e) =>
                    dispatch({ type: "SET_TITLE_FONT", payload: e.target.value })
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Noto Sans JP">Noto Sans JP（ゴシック）</option>
                  <option value="Noto Serif JP">Noto Serif JP（明朝）</option>
                  <option value="serif">明朝体</option>
                  <option value="sans-serif">ゴシック体</option>
                  <option value="Georgia, serif">Georgia（欧文セリフ）</option>
                  <option value="Impact, sans-serif">Impact（太字）</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-right">
              {state.titleText.length}/50
            </p>
          </div>

          {/* 表示テキスト */}
          <div>
            <label className="block text-sm font-medium mb-2">
              🎬 動画表示テキスト <span className="text-red-500">*</span>
            </label>
            <textarea
              value={state.quoteText}
              onChange={(e) =>
                dispatch({ type: "SET_QUOTE", payload: e.target.value })
              }
              placeholder="動画画面に表示されるメインテキスト"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-lg"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {state.quoteText.length}/200
            </p>
          </div>

          {/* ナレーション台本 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              🎙️ ナレーション台本
            </label>
            <textarea
              value={state.narrationScript}
              onChange={(e) =>
                dispatch({ type: "SET_NARRATION_SCRIPT", payload: e.target.value })
              }
              placeholder="ナレーションで読み上げる台本（30秒程度）"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {state.narrationScript.length}/500
            </p>
          </div>

          {/* 講師名・補足 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">講師名・出典</label>
              <input
                type="text"
                value={state.speakerName}
                onChange={(e) =>
                  dispatch({ type: "SET_SPEAKER", payload: e.target.value })
                }
                placeholder="例: 丸山敏雄"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                補足テキスト
              </label>
              <input
                type="text"
                value={state.contextLine}
                onChange={(e) =>
                  dispatch({ type: "SET_CONTEXT", payload: e.target.value })
                }
                placeholder="例: モーニングセミナーより"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                maxLength={100}
              />
            </div>
          </div>

          {/* 手動モードから戻る */}
          {state.manualMode && hasAISuggestions && (
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_MANUAL_MODE", payload: false })}
              className="text-sm text-amber-600 hover:text-amber-700 underline"
            >
              ← AI案から選び直す
            </button>
          )}
        </div>
      )}
    </div>
  );
}
