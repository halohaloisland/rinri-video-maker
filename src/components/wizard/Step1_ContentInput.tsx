"use client";

import { useCallback, useRef } from "react";
import type { VideoState } from "@/lib/types";
import type { Dispatch } from "react";

type Action =
  | { type: "SET_QUOTE"; payload: string }
  | { type: "SET_SPEAKER"; payload: string }
  | { type: "SET_CONTEXT"; payload: string }
  | { type: "SET_BG_IMAGE"; payload: string | null }
  | { type: "SET_BGM"; payload: string | null };

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
};

export function Step1_ContentInput({ state, dispatch }: Props) {
  const bgmInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleBgmUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: "SET_BGM", payload: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: "SET_BG_IMAGE", payload: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          名言・要約テキスト <span className="text-red-500">*</span>
        </label>
        <textarea
          value={state.quoteText}
          onChange={(e) =>
            dispatch({ type: "SET_QUOTE", payload: e.target.value })
          }
          placeholder="例: 人は鏡、万象はわが師"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none text-lg"
          maxLength={200}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {state.quoteText.length}/200
        </p>
      </div>

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
          補足テキスト（任意）
        </label>
        <input
          type="text"
          value={state.contextLine}
          onChange={(e) =>
            dispatch({ type: "SET_CONTEXT", payload: e.target.value })
          }
          placeholder="例: 倫理法人会モーニングセミナーより"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          maxLength={100}
        />
      </div>

      {/* 背景画像アップロード */}
      <div>
        <label className="block text-sm font-medium mb-2">
          背景画像（任意）
        </label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            画像を選択
          </button>
          {state.backgroundImage ? (
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg bg-cover bg-center border border-gray-200"
                style={{ backgroundImage: `url(${state.backgroundImage})` }}
              />
              <button
                type="button"
                onClick={() =>
                  dispatch({ type: "SET_BG_IMAGE", payload: null })
                }
                className="text-xs text-red-400 hover:text-red-600"
              >
                削除
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">
              ストーリースライドの背景に使用されます
            </span>
          )}
        </div>
      </div>

      {/* BGMアップロード */}
      <div>
        <label className="block text-sm font-medium mb-2">BGM（任意）</label>
        <input
          ref={bgmInputRef}
          type="file"
          accept="audio/*"
          onChange={handleBgmUpload}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => bgmInputRef.current?.click()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            音楽ファイルを選択
          </button>
          {state.bgmFile ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600">BGM設定済み</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_BGM", payload: null })}
                className="text-xs text-red-400 hover:text-red-600"
              >
                削除
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">
              MP3やWAVファイルをアップロード
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
