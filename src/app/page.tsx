import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          セミナー音声から
          <br />
          <span className="text-amber-700">リール動画を自動生成</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          セミナーの録音をアップロードするだけで、AIが要約→テキスト案を生成→写真と合わせてInstagramリール動画が完成します。
        </p>

        <Link
          href="/create"
          className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 text-lg font-semibold text-white bg-amber-700 rounded-xl hover:bg-amber-800 transition-colors shadow-lg"
        >
          動画を作成する
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="text-2xl mb-2">🎤</div>
            <h3 className="font-semibold text-sm mb-1">音声をアップロード</h3>
            <p className="text-xs text-gray-500">AIが自動で要約</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="text-2xl mb-2">📷</div>
            <h3 className="font-semibold text-sm mb-1">写真を追加</h3>
            <p className="text-xs text-gray-500">スライドショーに</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <div className="text-2xl mb-2">🎙️</div>
            <h3 className="font-semibold text-sm mb-1">ナレーション録音</h3>
            <p className="text-xs text-gray-500">台本付きで簡単</p>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          ※ 音声なしで手動テキスト入力でも作成可能
        </p>
      </div>
    </main>
  );
}
