"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useVideoState } from "@/hooks/useVideoState";
import { StepIndicator } from "@/components/wizard/StepIndicator";
import { Step1_AudioUpload } from "@/components/wizard/Step1_AudioUpload";
import { Step2_TextSelect } from "@/components/wizard/Step2_TextSelect";
import { Step3_PhotoUpload } from "@/components/wizard/Step3_PhotoUpload";
import { Step4_TemplateSelect } from "@/components/wizard/Step4_TemplateSelect";
import { Step5_RecordExport } from "@/components/wizard/Step5_RecordExport";

const TOTAL_STEPS = 5;

export default function CreatePage() {
  const [step, setStep] = useState(0);
  const [state, dispatch] = useVideoState();

  // Step1からの手動入力スキップ
  const handleSkipToManual = useCallback(() => {
    dispatch({ type: "SET_MANUAL_MODE", payload: true });
    setStep(1); // Step2のテキスト入力へ
  }, [dispatch]);

  // 各ステップの進行可否
  const canProceed = (() => {
    switch (step) {
      case 0: // 音声アップロード
        return state.textSuggestions.length > 0 || state.manualMode;
      case 1: // テキスト選択
        return state.quoteText.trim().length > 0;
      case 2: // 写真アップロード（任意なので常にtrue）
        return true;
      case 3: // テンプレート選択
        return true;
      case 4: // 録音・書き出し
        return false; // 最終ステップなので「次へ」なし
      default:
        return false;
    }
  })();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="border-b bg-white px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-amber-700">
            セミナー動画メーカー
          </Link>
          <button
            onClick={() => {
              dispatch({ type: "RESET" });
              setStep(0);
            }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            リセット
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 px-4 py-6">
        <StepIndicator currentStep={step} />

        <div className="mt-4">
          {step === 0 && (
            <Step1_AudioUpload
              state={state}
              dispatch={dispatch}
              onSkipToManual={handleSkipToManual}
            />
          )}
          {step === 1 && (
            <Step2_TextSelect state={state} dispatch={dispatch} />
          )}
          {step === 2 && (
            <Step3_PhotoUpload state={state} dispatch={dispatch} />
          )}
          {step === 3 && (
            <Step4_TemplateSelect state={state} dispatch={dispatch} />
          )}
          {step === 4 && (
            <Step5_RecordExport state={state} dispatch={dispatch} />
          )}
        </div>
      </main>

      {/* フッター（ナビゲーション） */}
      <footer className="border-t bg-white px-4 py-4 sticky bottom-0">
        <div className="max-w-5xl mx-auto flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-6 py-3 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← 戻る
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="px-6 py-3 text-sm font-semibold text-white bg-amber-700 rounded-xl hover:bg-amber-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              次へ →
            </button>
          ) : (
            <button
              onClick={() => {
                dispatch({ type: "RESET" });
                setStep(0);
              }}
              className="px-6 py-3 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              新しい動画を作成
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
