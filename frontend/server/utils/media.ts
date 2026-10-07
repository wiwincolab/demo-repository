import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// 照片與生成的圖放在 PVC（K8s 掛在 /data/media，api 與 worker 共用），資料表只記相對路徑
export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

const extension: Record<ImageMime, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// 看檔案開頭的位元組判斷格式，不信任檔名或 Content-Type：SVG、HTML 這類可以夾帶程式的檔案一律擋掉
export function sniffImageType(bytes: Uint8Array): ImageMime | null {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
    const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
    if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
    return null;
}

// 按月份分資料夾，單一目錄不會塞進幾萬個檔案
export function mediaRelativePath(id: string, mime: ImageMime, at: Date) {
    const month = String(at.getUTCMonth() + 1).padStart(2, '0');
    return `${at.getUTCFullYear()}/${month}/${id}.${extension[mime]}`;
}

export async function writeMedia(root: string, relativePath: string, bytes: Uint8Array) {
    const path = join(root, relativePath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
}

export const readMedia = (root: string, relativePath: string) => readFile(join(root, relativePath));
