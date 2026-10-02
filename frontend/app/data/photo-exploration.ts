/** Art-directed points in the photograph's 1086 × 724 coordinate space. */
export const photoMemories = [
  { id: 'mountain', sprite: 0, name: '富士山', title: '那天拍下的富士山', eyebrow: 'MOUNT FUJI',
    description: '山頂的雪、山腰的雲，這次都一起拍下來了。', prompt: '那天在哪裡拍照？和誰一起？',
    x: 547, y: 318, box: [266, 226, 608, 215], path: 'M266 419 L442 292 L551 234 L591 242 L640 291 L744 344 L874 422 L803 441 L326 441 Z' },
  { id: 'cafe', sprite: 1, name: '咖啡店', title: '富士山下的咖啡店', eyebrow: 'THE COFFEE STOP',
    description: '店裡亮著燈，窗外就是富士山。', prompt: '有進去坐坐嗎？還記得點了什麼？',
    x: 559, y: 553, box: [282, 458, 590, 166], path: 'M282 497 L424 497 L424 460 L627 460 L627 493 L872 493 L872 535 L858 535 L858 624 L296 624 L296 535 L282 535 Z' },
  { id: 'lamp', sprite: 3, name: '路燈', title: '照片裡的那盞路燈', eyebrow: 'BESIDE THE ROAD',
    description: '路燈和樹影，也一起留在了照片裡。', prompt: '拍完這張照片，接著去了哪裡？',
    x: 953, y: 358, box: [927, 204, 90, 458], path: 'M932 211 L1014 204 L1017 215 L946 222 L958 645 L969 655 L969 662 L932 662 L933 650 L938 644 Z' },
] as const;

export type PhotoMemory = typeof photoMemories[number];
