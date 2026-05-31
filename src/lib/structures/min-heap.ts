/**
 * 通用二叉最小堆。原本作为 `AStarMinHeap` 内联在 place-roads.ts 里,
 * 与寻路逻辑无关,抽到这里以便复用与单测。
 *
 * 比较语义与原实现**逐字保持一致**(bubbleUp 用 `<=`、bubbleDown 用 `<`),
 * 以免改变 A* 在优先级相等时的出队顺序、进而改变最终路径。
 */
export class MinHeap<T> {
  private data: T[] = [];

  constructor(private readonly priorityOf: (item: T) => number) {}

  get size(): number {
    return this.data.length;
  }

  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    const p = this.priorityOf;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (p(this.data[parent]) <= p(this.data[i])) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const p = this.priorityOf;
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = i * 2 + 1;
      const right = left + 1;
      if (left < n && p(this.data[left]) < p(this.data[smallest])) {
        smallest = left;
      }
      if (right < n && p(this.data[right]) < p(this.data[smallest])) {
        smallest = right;
      }
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}
