// 上傳前先在手機上縮圖：長邊 1600px 的 JPEG 約 0.3–0.6 MB，現場網路慢也傳得上去，
// 對生圖來說也夠清楚（輸出只有 1K）
export function fitWithin(width: number, height: number, max: number) {
    const scale = Math.min(1, max / Math.max(width, height));
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function resizeToJpeg(file: Blob, max = 1600, quality = 0.86) {
    // from-image：照 EXIF 轉正，直拍的手機照片才不會躺著
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const size = fitWithin(bitmap.width, bitmap.height, max);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('照片無法轉成 JPEG')), 'image/jpeg', quality));
    return { blob, ...size };
}
