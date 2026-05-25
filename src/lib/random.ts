/**
 * Mulberry32 PRNG — 给定种子产生确定的随机序列。
 * 参考：https://stackoverflow.com/a/47593316
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a 字符串 hash，把任意字符串折成一个 32 位整数种子。
 */
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 从字符串直接得到一个 PRNG。 */
export function rngFor(seedString: string): () => number {
  return mulberry32(hashString(seedString));
}

/** 在 [min, max) 区间内取一个确定的浮点数。 */
export function rangeFrom(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}
