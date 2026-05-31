/**
 * 并查集(带路径压缩)。原本内联在 build-tag-graph.ts,与"按 tag 生成树"
 * 无关,抽到这里以便复用与单测。逻辑与原实现一致。
 */
export class UnionFind<T = string> {
  private parent = new Map<T, T>();

  find(id: T): T {
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // 路径压缩
    let node = id;
    while (node !== root) {
      const next = this.parent.get(node)!;
      this.parent.set(node, root);
      node = next;
    }
    return root;
  }

  connected(a: T, b: T): boolean {
    return this.find(a) === this.find(b);
  }

  union(a: T, b: T): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent.set(ra, rb);
    return true;
  }

  ensure(id: T): void {
    if (!this.parent.has(id)) this.parent.set(id, id);
  }
}
