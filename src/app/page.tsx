import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          セミナー音声から
          <br />
          <span className="text-amber-700">リール動画を自動生成</span>
        </h1>

        <p className="text-lg text-gray-600 leading-relaxed">
          セミナーの録音をアップロードするだけで、
          <br className="hidden sm:block" />
          AIが要約→テキスト案を生成→写真と合わせて
          <br className="hidden sm:block" />
          Instagramリール動画が完成します。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/create"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-amber-700 rounded-xl hover:bg-amber-800 transition-colors shadow-lg"
          >
            🎬 動画を作成する
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          <div className="p-5 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-3">🎤</div>
            <h3 className="font-semibold mb-1">音声をアップロード</h3>
            <p className="text-sm text-gray-500">
              セミナー録音をアップするとAIが自動で要約
            </p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-3">📷</div>
            <h3 className="font-semibold mb-1">写真を追加</h3>
            <p className="text-sm text-gray-500">
              セミナー写真2〜3枚でスライドショーに
            </p>
          </div>
          <div className="p-5 bg-white rounded-xl shadow-sm">
            <div className="text-3xl mb-3">🎙️</div>
            <h3 className="font-semibold mb-1">ナレーション録音</h3>
            <p className="text-sm text-gray-500">
              AIが台本を生成、声を吹き込めば完成
            </p>
          </div>
        </div>

        <div className="text-sm text-gray-400 pt-4">
          ※ 音声なしで手動テキスト入力でも作成可能です
        </div>
      </div>
    </main>
  );
}
