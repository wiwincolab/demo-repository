import { dHashFromGray } from './image-hash.ts';

// 上傳前先在手機上縮圖：長邊 1600px 的 JPEG 約 0.3–0.6 MB，現場網路慢也傳得上去，
// 給 Gemini 看照片也夠清楚。順便算照片指紋，共同遊記用它收起重複的照片
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
    // 9×8 灰階 → dHash（app/utils/image-hash.ts）
    const tiny = document.createElement('canvas');
    tiny.width = 9; tiny.height = 8;
    const tinyContext = tiny.getContext('2d', { willReadFrequently: true })!;
    tinyContext.drawImage(bitmap, 0, 0, 9, 8);
    const pixels = tinyContext.getImageData(0, 0, 9, 8).data;
    const gray = Array.from({ length: 72 }, (_, i) => pixels[i * 4]! * 0.299 + pixels[i * 4 + 1]! * 0.587 + pixels[i * 4 + 2]! * 0.114);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('照片無法轉成 JPEG')), 'image/jpeg', quality));
    return { blob, ...size, hash: dHashFromGray(gray) };
}
