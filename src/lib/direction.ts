/**
 * 四方向(N/E/S/W)的唯一真相源。
 *
 * 在此之前,"四个方向"在仓库里有三套互不相通、且各被手写多遍的表示:
 *   - bit 掩码 N=1/E=2/S=4/W=8(road-tiles.ts、road-debug.ts、layout.ts 各定义一份)
 *   - index 0..3(place-roads.ts 的 INCOMING_DIRS / incomingDir*)
 *   - 四邻偏移 {dc,dr}(grid.neighbors4、road-tiles.maskForCell、place-roads 各写一遍)
 *
 * 现在统一到这里。约定(务必与历史数值保持一致,这些值被各处依赖):
 *   - index:  n=0, e=1, s=2, w=3   (与旧 INCOMING_DIRS 顺序相同)
 *   - bit:    n=1, e=2, s=4, w=8   (与旧 DIR_N/E/S/W 相同)
 *   - offset: 列 dc / 行 dr,行向下为 +(与旧实现相同)
 */

export type Dir4 = 'n' | 'e' | 's' | 'w';

/** 规范顺序;数组下标即方向 index(n=0, e=1, s=2, w=3)。 */
export const DIRECTIONS: readonly Dir4[] = ['n', 'e', 's', 'w'];

/** 方向 → 网格偏移(列 dc / 行 dr)。 */
export const DIR_OFFSET: Record<Dir4, { dc: number; dr: number }> = {
  n: { dc: 0, dr: -1 },
  e: { dc: 1, dr: 0 },
  s: { dc: 0, dr: 1 },
  w: { dc: -1, dr: 0 },
};

/** 方向 → 连接位(N=1, E=2, S=4, W=8)。 */
export const DIR_BIT: Record<Dir4, number> = {
  n: 1,
  e: 2,
  s: 4,
  w: 8,
};

/** 便捷数字常量;等价于 DIR_BIT.n 等,供位掩码表达式直接使用。 */
export const DIR_N = DIR_BIT.n;
export const DIR_E = DIR_BIT.e;
export const DIR_S = DIR_BIT.s;
export const DIR_W = DIR_BIT.w;

/** 与 DIRECTIONS 顺序一致的四邻偏移数组(n, e, s, w)。 */
export const NEIGHBOR4_OFFSETS: ReadonlyArray<{ dc: number; dr: number }> =
  DIRECTIONS.map((d) => DIR_OFFSET[d]);

/** 方向 → index(n=0, e=1, s=2, w=3)。 */
export function dirIndex(dir: Dir4): number {
  return DIRECTIONS.indexOf(dir);
}

/** index → 方向;越界返回 null。 */
export function dirFromIndex(index: number): Dir4 | null {
  return DIRECTIONS[index] ?? null;
}

/** 相反方向(n↔s, e↔w)。 */
export function opposite(dir: Dir4): Dir4 {
  switch (dir) {
    case 'n':
      return 's';
    case 's':
      return 'n';
    case 'e':
      return 'w';
    case 'w':
      return 'e';
  }
}

/** 单位偏移 → 方向;非单位(对角/零/跨格)返回 null。 */
export function dirFromDelta(dc: number, dr: number): Dir4 | null {
  if (dc === 0 && dr === -1) return 'n';
  if (dc === 1 && dr === 0) return 'e';
  if (dc === 0 && dr === 1) return 's';
  if (dc === -1 && dr === 0) return 'w';
  return null;
}
