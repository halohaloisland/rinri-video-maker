"use client";

const STEPS = [
  { label: "音声", icon: "🎤" },
  { label: "テキスト", icon: "✏️" },
  { label: "写真", icon: "📷" },
  { label: "テンプレ", icon: "🎨" },
  { label: "録音・出力", icon: "🎬" },
];

type Props = {
  currentStep: number;
};

export function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1 sm:gap-2">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                i < currentStep
                  ? "bg-green-500 text-white"
                  : i === currentStep
                  ? "bg-amber-700 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {i < currentStep ? "✓" : step.icon}
            </div>
            <span
              className={`text-[10px] sm:text-xs mt-1 ${
                i <= currentStep ? "text-amber-700 font-medium" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-4 sm:w-8 h-0.5 mb-5 ${
                i < currentStep ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
