---
title: "确定性随机：让程序生成的世界保持稳定"
date: 2025-09-02
summary: "Mulberry32 和它的朋友们。"
tags: [tech, math, procedural]
---

# 确定性随机：让程序生成的世界保持稳定

如果你的程序生成内容用 `Math.random()`，那每次刷新都会变。
对于游戏来说这未必是坏事，但是对一个"博客地图"——
我希望每次回到同一个文件夹，看到的还是同一片地形。

解决办法是 **seeded PRNG**（伪随机数生成器）。
给它一个种子，它给你一个确定的随机数序列。同样的种子，永远是同样的序列。

我现在最喜欢 Mulberry32，因为它只有几行代码：

```ts
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

把文件名 hash 成种子，那这个文件对应的"建筑"位置就永远在那里。
即使你新增了别的文件，旧文件的位置也不会变——
这就是地图的"记忆"。
