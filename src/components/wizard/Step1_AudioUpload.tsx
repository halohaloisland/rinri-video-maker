"use client";

import { useCallback, useRef, useState } from "react";
import type { VideoState } from "@/lib/types";
import type { Dispatch } from "react";
import type { Action } from "@/hooks/useVideoState";
import { compressAudioForTranscription, formatFileSize } from "@/lib/audio-compress";

type Props = {
  state: VideoState;
  dispatch: Dispatch<Action>;
  onSkipToManual: () => void;
};

export function Step1_AudioUpload({ state, dispatch, onSkipToManual }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 元のFileオブジェクトを保持（FormData送信用）
  const [rawFile, setRawFile] = useState<File | null>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setRawFile(file);
      dispatch({
        type: "SET_AUDIO_FILE",
        payload: { data: "uploaded", name: file.name },
      });
    },
    [dispatch]
  );

  const [compressStatus, setCompressStatus] = useState("");

  const handleTranscribe = useCallback(async () => {
    if (!rawFile) return;

    dispatch({ type: "SET_TRANSCRIBING", payload: true });

    try {
      // Step 1: 音声を圧縮（16kHz モノラル WAV → サイズ大幅削減）
      setCompressStatus(`音声を圧縮中...（元: ${formatFileSize(rawFile.size)}）`);
      const compressedBlob = await compressAudioForTranscription(rawFile);
      setCompressStatus(`圧縮完了: ${formatFileSize(compressedBlob.size)} → AIに送信中...`);

      // Step 2: FormDataで送信
      const formData = new FormData();
      formData.append("audio", compressedBlob, "compressed.wav");
      formData.append("mimeType", "audio/wav");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      setCompressStatus("");

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("サーバーからの応答が不正です。もう一度お試しください。");
      }

      if (!res.ok) {
        throw new Error(data.error || "APIエラーが発生しました");
      }

      dispatch({ type: "SET_TRANSCRIPT", payload: data.transcript });
      dispatch({ type: "SET_TEXT_SUGGESTIONS", payload: data.suggestions || [] });
    } catch (err) {
      setCompressStatus("");
      alert(err instanceof Error ? err.message : "音声の処理に失敗しました");
    } finally {
      dispatch({ type: "SET_TRANSCRIBING", payload: false });
    }
  }, [rawFile, dispatch]);

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">セミナー音声をアップロード</h2>
        <p className="text-sm text-gray-500 mt-2">
          セミナーの録音データをアップロードすると、AIが自動で要約してリール動画用のテキストを生成します
        </p>
      </div>

      {/* ファイルアップロード */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-amber-400 transition-colors">
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

        {!rawFile ? (
          <div className="space-y-4">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition-colors font-medium">
              音声ファイルを選択
            </button>
            <p className="text-xs text-gray-400">MP3, WAV, M4A, WebM に対応</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">{state.audioFileName}</p>
                <p className="text-xs text-green-600">アップロード完了</p>
              </div>
              <button type="button" onClick={() => { dispatch({ type: "CLEAR_AUDIO" }); setRawFile(null); }}
                className="text-xs text-red-400 hover:text-red-600 ml-2">削除</button>
            </div>

            {/* AI要約ボタン */}
            {!state.isTranscribing && state.textSuggestions.length === 0 && (
              <button type="button" onClick={handleTranscribe}
                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all font-semibold shadow-lg text-lg">
                ✨ AIで要約する
              </button>
            )}

            {/* 処理中 */}
            {state.isTranscribing && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-amber-700 border-t-transparent rounded-full" />
                  <span className="text-amber-700 font-medium">
                    {compressStatus || "AIが音声を分析中..."}
                  </span>
                </div>
                <p className="text-xs text-gray-400">1〜2分かかる場合があります</p>
              </div>
            )}

            {/* 完了 */}
            {state.textSuggestions.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-green-700 font-medium">✅ {state.textSuggestions.length}つのテキスト案が生成されました！</p>
                <p className="text-xs text-green-600 mt-1">「次へ」を押して案を選択・編集してください</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 手動入力リンク */}
      <div className="text-center">
        <button type="button" onClick={onSkipToManual}
          className="text-sm text-gray-400 hover:text-amber-700 underline transition-colors">
          音声なしで手動入力する →
        </button>
      </div>
    </div>
  );
}
