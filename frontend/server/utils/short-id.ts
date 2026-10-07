import { randomInt } from 'node:crypto';

// 分享、邀請、禮物連結的短碼：8 碼、去掉 0/o、1/l/i 這類容易看錯的字。
// 31^8 ≈ 8,500 億種，猜不到；又短到可以印在限動圖卡、也好掃
const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
const pattern = new RegExp(`^[${alphabet}]{8}$`);

export const shortId = () => Array.from({ length: 8 }, () => alphabet[randomInt(alphabet.length)]).join('');
export const isShortId = (value: unknown): value is string => typeof value === 'string' && pattern.test(value);
