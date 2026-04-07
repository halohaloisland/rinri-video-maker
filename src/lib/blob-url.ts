/**
 * base64 data URL を Blob URL に変換
 * モバイルSafariではdata URLが大きいとimg要素で表示できない問題を回避
 */

const blobUrlCache = new Map<string, string>();

export function base64ToBlobUrl(dataUrl: string): string {
  // 既にblob URLの場合はそのまま返す
  if (dataUrl.startsWith("blob:")) return dataUrl;

  // キャッシュチェック（同じdata URLを何度も変換しない）
  const cacheKey = dataUrl.substring(0, 100); // 先頭100文字でキャッシュキー
  const cached = blobUrlCache.get(cacheKey);
  if (cached) return cached;

  try {
    // data:image/jpeg;base64,... を分解
    const [header, base64Data] = dataUrl.split(",");
    if (!base64Data || !header) return dataUrl;

    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

    // base64 → バイナリ
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // キャッシュ保存
    blobUrlCache.set(cacheKey, blobUrl);

    return blobUrl;
  } catch {
    return dataUrl; // 変換失敗時は元のdata URLを返す
  }
}

/**
 * 写真配列をまとめてBlob URL化
 */
export function photosToBlobs(photos: string[]): string[] {
  return photos.map(base64ToBlobUrl);
}
