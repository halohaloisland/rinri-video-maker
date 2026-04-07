"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [showRestore, setShowRestore] = useState(false);
  const [state, dispatch, { saveTemplate, loadTemplate, saveStep }] = useVideoState();

  // 起動時: 前回の状態があれば復元ダイアログ表示
  useEffect(() => {
    const handler = (e: Event) => {
      const savedStep = (e as CustomEvent).detail;
      if (savedStep > 0) {
        setShowRestore(true);
      }
    };
    window.addEventListener("restore-step", handler);
    return () => window.removeEventListener("restore-step", handler);
  }, []);

  // ステップ変更時に保存
  useEffect(() => {
    saveStep(step);
  }, [step, saveStep]);

  const handleRestore = useCallback(() => {
    const savedStep = parseInt(localStorage.getItem("rinri-video-state-step") || "0", 10);
    setStep(Math.max(0, savedStep - 1)); // 1つ前のステップに戻す（安全のため）
    setShowRestore(false);
  }, []);

  const handleDismissRestore = useCallback(() => {
    setShowRestore(false);
    dispatch({ type: "RESET" });
    setStep(0);
  }, [dispatch]);

  const handleSkipToManual = useCallback(() => {
    dispatch({ type: "SET_MANUAL_MODE", payload: true });
    setStep(1);
  }, [dispatch]);

  const canProceed = (() => {
    switch (step) {
      case 0: return state.textSuggestions.length > 0 || state.manualMode;
      case 1: return state.quoteText.trim().length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return false;
      default: return false;
    }
  })();

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* 復元ダイアログ */}
      {showRestore && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">📋 前回の作業データがあります</h3>
            <p className="text-sm text-gray-600">
              前回の編集途中のデータが残っています。続きから再開しますか？
            </p>
            <div className="flex gap-3">
              <button onClick={handleRestore}
                className="flex-1 px-4 py-3 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors">
                続きから再開
              </button>
              <button onClick={handleDismissRestore}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                新規作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="border-b bg-white px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-amber-700">
            セミナー動画メーカー
          </Link>
          <div className="flex items-center gap-3">
            {/* テンプレート保存/読み込み */}
            <button onClick={saveTemplate}
              className="text-xs text-amber-600 hover:text-amber-800 transition-colors" title="現在の設定をテンプレートとして保存">
              💾 保存
            </button>
            <button onClick={() => { if (loadTemplate()) { alert("前回のテンプレートを読み込みました"); } else { alert("保存済みテンプレートがありません"); } }}
              className="text-xs text-amber-600 hover:text-amber-800 transition-colors" title="保存したテンプレートを読み込み">
              📂 読込
            </button>
            <button
              onClick={() => {
                if (confirm("全てリセットしますか？")) {
                  dispatch({ type: "RESET" });
                  setStep(0);
                }
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              リセット
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 px-4 py-6">
        <StepIndicator currentStep={step} />

        <div className="mt-4">
          {step === 0 && (
            <Step1_AudioUpload state={state} dispatch={dispatch} onSkipToManual={handleSkipToManual} />
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

      {/* フッター */}
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
                saveTemplate(); // 最終画面で自動テンプレ保存
                if (confirm("新しい動画を作成しますか？\n（テンプレートは保存されています）")) {
                  dispatch({ type: "RESET" });
                  setStep(0);
                }
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
