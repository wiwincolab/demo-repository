// 照片指紋（dHash）：縮成 9×8 灰階，每一格跟右邊比亮暗，得到 64 位元。
// 連拍、同一張傳兩次的指紋只差幾個位元，共同遊記用它把重複的收起來，不必呼叫 AI
export function dHashFromGray(gray: number[]) {
    let bits = '';
    for (let row = 0; row < 8; row++)
        for (let col = 0; col < 8; col++) bits += gray[row * 9 + col]! > gray[row * 9 + col + 1]! ? '1' : '0';
    return Array.from({ length: 16 }, (_, i) => parseInt(bits.slice(i * 4, i * 4 + 4), 2).toString(16)).join('');
}

export function hamming(a: string, b: string) {
    let distance = 0;
    for (let i = 0; i < 16; i++) {
        let x = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16);
        while (x) { distance += x & 1; x >>= 1; }
    }
    return distance;
}
