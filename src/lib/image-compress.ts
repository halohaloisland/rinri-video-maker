/**
 * 画像をリサイズ・圧縮してbase64で返す
 * モバイルSafariでRemotionがメモリ不足になるのを防ぐ
 *
 * @param file 元の画像File
 * @param maxWidth 最大幅（デフォルト1080px = リール幅）
 * @param quality JPEG品質（0-1、デフォルト0.8）
 */
// モバイル判定
function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function compressImage(
  file: File,
  maxWidth?: number,
  quality?: number
): Promise<string> {
  // モバイルでは画像をより小さく（メモリ節約）
  const mobile = isMobile();
  const _maxWidth = maxWidth ?? (mobile ? 540 : 1080);
  const _quality = quality ?? (mobile ? 0.5 : 0.75);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ファイル読み込みに失敗しました"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.onload = () => {
        // リサイズ計算
        let { width, height } = img;
        if (width > _maxWidth) {
          height = Math.round((height * _maxWidth) / width);
          width = _maxWidth;
        }
        // 高さも制限
        const maxHeight = mobile ? 960 : 1920;
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        // Canvas でリサイズ描画
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context を取得できません"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG base64 で出力（PNGより大幅にサイズ削減）
        const compressed = canvas.toDataURL("image/jpeg", _quality);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
