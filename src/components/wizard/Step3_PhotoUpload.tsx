"use client";

import { useCallback, useRef, useState } from "react";
import type { VideoState } from "@/lib/types";
import type { Dispatch } from "react";
import type { Action } from "@/hooks/useVideoState";

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
};

export function Step3_PhotoUpload({ state, dispatch }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endingImageRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number>(-1);

  const handleReplacePhoto = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || replaceIndex < 0) return;
      const reader = new FileReader();
      reader.onload = () => {
        const newPhotos = [...state.photos];
        newPhotos[replaceIndex] = reader.result as string;
        dispatch({ type: "REORDER_PHOTOS", payload: newPhotos });
      };
      reader.readAsDataURL(file);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
      setReplaceIndex(-1);
    },
    [replaceIndex, state.photos, dispatch]
  );

  const handleEndingImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: "SET_ENDING_IMAGE", payload: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remaining = 3 - state.photos.length;
      const toProcess = Array.from(files).slice(0, remaining);

      toProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          dispatch({ type: "ADD_PHOTO", payload: reader.result as string });
        };
        reader.readAsDataURL(file);
      });

      // input をリセット
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [state.photos.length, dispatch]
  );

  const movePhoto = useCallback(
    (fromIdx: number, direction: "up" | "down") => {
      const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
      if (toIdx < 0 || toIdx >= state.photos.length) return;
      const newPhotos = [...state.photos];
      [newPhotos[fromIdx], newPhotos[toIdx]] = [newPhotos[toIdx], newPhotos[fromIdx]];
      dispatch({ type: "REORDER_PHOTOS", payload: newPhotos });
    },
    [state.photos, dispatch]
  );

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">セミナー写真をアップロード</h2>
        <p className="text-sm text-gray-500 mt-2">
          セミナー中に撮影した写真を2〜3枚アップロードしてください。動画内でスライドショーとして表示されます。
        </p>
      </div>

      {/* アップロードエリア */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 写真グリッド */}
      <input ref={replaceInputRef} type="file" accept="image/*" onChange={handleReplacePhoto} className="hidden" />
      <div className="grid grid-cols-3 gap-3">
        {state.photos.map((photo, idx) => (
          <div key={idx} className="relative">
            <div
              className="aspect-[9/16] rounded-xl bg-cover bg-center border-2 border-gray-200"
              style={{ backgroundImage: `url(${photo})` }}
            />
            {/* 番号バッジ */}
            <div className="absolute top-2 left-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
              {idx + 1}
            </div>
            {/* 削除ボタン（常時表示） */}
            <button type="button"
              onClick={() => dispatch({ type: "REMOVE_PHOTO", payload: idx })}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg">
              ✕
            </button>
            {/* 下部ボタン: 変更・並び替え（常時表示） */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 rounded-b-xl py-1.5 flex items-center justify-center gap-2">
              <button type="button"
                onClick={() => { setReplaceIndex(idx); replaceInputRef.current?.click(); }}
                className="px-2 py-0.5 bg-white/80 text-gray-700 rounded text-[10px] font-medium">
                変更
              </button>
              {idx > 0 && (
                <button type="button" onClick={() => movePhoto(idx, "up")}
                  className="w-6 h-6 bg-white/80 text-gray-700 rounded-full flex items-center justify-center text-[10px]">
                  ←
                </button>
              )}
              {idx < state.photos.length - 1 && (
                <button type="button" onClick={() => movePhoto(idx, "down")}
                  className="w-6 h-6 bg-white/80 text-gray-700 rounded-full flex items-center justify-center text-[10px]">
                  →
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 追加ボタン */}
        {state.photos.length < 3 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[9/16] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
          >
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs text-gray-400">写真を追加</span>
          </button>
        )}
      </div>

      {/* ステータス */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {state.photos.length}/3 枚アップロード済み
        </p>
        {state.photos.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">
            写真なしでも動画は作成できます
          </p>
        )}
      </div>

      {/* ===== 最後の場面 ===== */}
      <div className="border-t pt-6 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-800">🎬 最後の場面（エンディング）</h3>
          <p className="text-sm text-gray-500 mt-1">
            動画の最後に表示する画像とテキストを設定できます
          </p>
        </div>

        {/* エンディング画像 */}
        <div className="flex justify-center">
          <input
            ref={endingImageRef}
            type="file"
            accept="image/*"
            onChange={handleEndingImageUpload}
            className="hidden"
          />
          {!state.endingImage ? (
            <button
              type="button"
              onClick={() => endingImageRef.current?.click()}
              className="w-40 aspect-[9/16] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-400">エンディング画像</span>
            </button>
          ) : (
            <div className="relative group w-40">
              <div
                className="aspect-[9/16] rounded-xl bg-cover bg-center border-2 border-amber-400"
                style={{ backgroundImage: `url(${state.endingImage})` }}
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold">
                END
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_ENDING_IMAGE", payload: null })}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => endingImageRef.current?.click()}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/90 text-gray-700 rounded text-[10px] shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                変更
              </button>
            </div>
          )}
        </div>

        {/* エンディングテキスト */}
        <div className="space-y-4 max-w-sm mx-auto">
          {/* メインテキスト */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">メインテキスト</label>
            <input
              type="text"
              value={state.endingText}
              onChange={(e) => dispatch({ type: "SET_ENDING_TEXT", payload: e.target.value })}
              placeholder="例: フォローお願いします！"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
              maxLength={30}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">サイズ: {state.endingTextSize}px</span>
              <input type="range" min="28" max="80" value={state.endingTextSize}
                onChange={(e) => dispatch({ type: "SET_ENDING_TEXT_SIZE", payload: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
            </div>
          </div>

          {/* サブテキスト */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">サブテキスト</label>
            <input
              type="text"
              value={state.endingSubText}
              onChange={(e) => dispatch({ type: "SET_ENDING_SUB_TEXT", payload: e.target.value })}
              placeholder="例: @your_account / 倫理法人会○○支部"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
              maxLength={50}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20">サイズ: {state.endingSubTextSize}px</span>
              <input type="range" min="18" max="56" value={state.endingSubTextSize}
                onChange={(e) => dispatch({ type: "SET_ENDING_SUB_TEXT_SIZE", payload: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">
          ※ 未設定の場合は講師名とセミナー名が表示されます
        </p>
      </div>
    </div>
  );
}
