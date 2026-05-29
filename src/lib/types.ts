export interface NoteData {
  /** Astro 的 entry id，如 "travel/kyoto-rain" */
  id: string;
  /** 路由 slug */
  slug: string;
  /** frontmatter 标题 */
  title: string;
  /** 正文字数（字符数，即 entry.body.length） */
  size: number;
  /** 修改/发布日期 ISO 字符串 */
  date: string;
  /** 摘要 */
  summary?: string;
  /** 标签 */
  tags: string[];
  /** 所属大陆 = 第一层文件夹名 */
  continentId: string;
  /** 可选：强制使用某建筑模型 id */
  building?: string;
}

export interface ContinentData {
  id: string;            // 文件夹名，如 "travel"
  label: string;         // 展示名（首字母大写）
  notes: NoteData[];
  totalSize: number;     // 大陆总字数 = 各 note.size 之和
}

export type WorldTree = ContinentData[];

export type ViewState =
  | { kind: 'globe' }
  | { kind: 'map'; continentId: string };

export type SortKey = 'default' | 'size' | 'name' | 'date';
