export const memoryCategories = [
  { name: '旅程', color: '#cab6ff', center: [0, 0, 0] },
  { name: '美食', color: '#ffb080', center: [-4.2, 2.8, 1] },
  { name: '玩樂', color: '#e6a0d7', center: [4.2, 2.7, -.8] },
  { name: '景點', color: '#83cabe', center: [-4, -1.2, -2] },
  { name: '旅伴', color: '#f1d784', center: [0, 4, -2.8] },
  { name: '住宿', color: '#96b5f3', center: [4, -1.4, 1.5] },
  { name: '交通', color: '#96d39c', center: [-2.1, -4, 1.7] },
  { name: '購物', color: '#dc9ea8', center: [2.3, -4, -1.6] },
];
export function memoryCategory(tag: string) { return memoryCategories.find(c => c.name === tag) || memoryCategories[0]!; }
