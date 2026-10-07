import { randomUUID } from 'node:crypto';
import type { H3Event } from 'h3';
import { getCookie, setCookie } from 'h3';
import { db } from './db.ts';

// 評審不用登入：第一次呼叫 API 就發一個匿名裝置 ID 存在 cookie，照片、作品、分享都記在這台裝置下
export const DEVICE_COOKIE = 'ct_device';

// 裝置、照片、作品的 ID 都是 randomUUID() 產生的 v4；格式不對就不拿去查資料庫
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const isUuid = (value: unknown): value is string => typeof value === 'string' && uuidV4.test(value);
export const isDeviceId = isUuid;

export async function requireDevice(event: H3Event): Promise<string> {
    let id = getCookie(event, DEVICE_COOKIE);
    if (!isDeviceId(id)) {
        id = randomUUID();
        // 一年：決賽前先試用、當天再打開，看得到自己做過的作品
        setCookie(event, DEVICE_COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' });
    }
    const sql = await db();
    await sql`insert into devices (id) values (${id}) on conflict do nothing`;
    return id;
}
