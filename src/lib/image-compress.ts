/**
 * 画像をリサイズ・圧縮してbase64で返す
 * モバイルSafariでRemotionがメモリ不足になるのを防ぐ
 *
 * @param file 元の画像File
 * @param maxWidth 最大幅（デフォルト1080px = リール幅）
 * @param quality JPEG品質（0-1、デフォルト0.8）
 */
export function compressImage(
  file: File,
  maxWidth = 1080,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ファイル読み込みに失敗しました"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.onload = () => {
        // リサイズ計算
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        // 高さも制限（9:16のリール用に最大1920px）
        const maxHeight = 1920;
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
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
