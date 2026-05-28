# Personal Blog World — MVP

把博客做成一个可探索的"世界"——主页是一个 3D 地球，每个文件夹是一片大陆，
双击进入云朵转场，落到 2.5D 正交投影的地图上，每个 markdown 文件是一座建筑。

## Stack

- **Astro 5** — 静态站点 + content collections（默认零 JS）
- **React 18** — 客户端岛屿
- **React Three Fiber + drei** — 3D 场景
- **Three.js** — 底层 WebGL
- **Zustand** — 视图状态
- **TypeScript** — 全局类型

字体来自 Google Fonts：Fraunces（display）/ Inter Tight（body）/ JetBrains Mono（meta）。



## 开发

```bash
# Node 22.20+
npm install
npm run dev          # http://localhost:4321
npm run build        # 静态构建到 dist/
npm run preview      # 预览构建
```

## 项目结构

```
.
├── astro.config.mjs           # Astro + React；remark/rehype（Obsidian、KaTeX）
├── scripts/
│   └── sync-note-attachments.mjs  # dev/build 前同步 attachments
├── public/
│   └── images/                # 静态资源（如缺失图片占位）
└── src/
    ├── content.config.ts      # content collection schema
    ├── env.d.ts
    ├── content/notes/
    │   ├── attachments/       # 全库图片/PDF（Obsidian ![[...]]，不参与 3D 地图）
    │   ├── travel/            # 大陆 = 第一层文件夹
    │   ├── tech/
    │   ├── journal/
    │   ├── thoughts/
    │   ├── test/
    │   └── Classnotes/        # 可含子文件夹（如 z大三/）
    ├── components/
    │   ├── World.tsx          # 总入口：相机 / 视图状态 / 转场
    │   ├── Globe.tsx          # 3D 地球 + 大陆长方体
    │   ├── MapView.tsx        # 2.5D 正交地图 + 建筑 + 装饰物
    │   ├── TagBridgePaths.tsx # tag 木板路 / 彩虹桥 3D 渲染
    │   ├── CloudTransition.tsx# globe ↔ map 云朵转场
    │   ├── DetailsPanel.tsx   # 右侧滑出详情
    │   ├── Sidebar.tsx        # 文件列表 + sort + tag paths 开关
    │   └── HUD.tsx            # 顶部面包屑 + 帮助
    ├── layouts/
    │   ├── BaseLayout.astro   # html shell + 字体
    │   └── NoteLayout.astro   # 单篇 note 阅读页
    ├── lib/
    │   ├── types.ts           # WorldTree / NoteData / TagBridge …
    │   ├── random.ts          # mulberry32 + FNV-1a hash
    │   ├── build-tree.ts      # content collection → WorldTree + tagBridges
    │   ├── layout.ts          # 球面 / 平面建筑布局
    │   ├── tag-bridges.ts     # tag 生成树选边（距离、度数、桥型）
    │   ├── plank-bridge.ts    # 桥曲线、木板几何、桥廊采样
    │   ├── note-metadata.ts   # title / date 解析
    │   ├── content-paths.ts   # notes 根路径、attachments 常量
    │   ├── remark-obsidian-images.ts   # ![[image]] / PDF 嵌入
    │   └── remark-obsidian-wikilinks.ts # [[wikilink]] → 站内链接
    ├── pages/
    │   ├── index.astro        # 3D 世界
    │   └── notes/[...slug].astro  # 单篇 markdown 路由
    ├── store.ts               # zustand 视图状态
    └── styles/global.css      # 全局美学：老地图 / 探险家手册
```

## 已实现（MVP 范围）

- 3D 地球 + 自动生成的长方体大陆（位置基于固定种子）
- 拖拽旋转 / 鼠标滚轮缩放
- 单击大陆显示名称气泡 + 笔记计数
- 双击大陆 → 云朵转场 → 进入 2.5D 地图
- 2.5D 正交投影地图，建筑大小 = 文件大小（log 压缩）
- 建筑位置基于 `(continentId + noteId)` 哈希种子，**永远稳定**
- 单击建筑 → 右侧详情面板滑出
- 双击建筑 → 跳转到 markdown 阅读页
- 右侧文件列表（hover → 建筑高亮）
- sort_by 模式：所有建筑升空成浮岛，下挂铭牌，pattern 承托
- ESC 返回 / 关闭面板
- 装饰物（树、石头）随机散布，种子稳定
- **tag 木板路**：同大陆内按 tag 生成树连通（k−1 条桥）；优先连近距离、每建筑 ≤3 条边；共享 2/3+ tag 为双色/彩虹桥；固定宽度等距木板（数量随桥长）；纵梁/桩/索栏；Sidebar「tag paths」开关

## 留待之后（未做）

- 子地图（子文件夹）—— MVP 内未实现
- 文章 wikilink 在地图上以路径连接（tag 木板路已实现）
- 移动端触控优化
- 真正的低多边形 GLTF 模型（目前是基础几何体）
- WebGL 后处理：grain / vignette / bloom
- markdown 渲染插件（代码高亮、表格、脚注 等）

## 交互速查


| 视图      | 鼠标                                  | 键盘          |
| ------- | ----------------------------------- | ----------- |
| Globe   | 拖拽 = 旋转；单击大陆 = 聚焦；双击大陆 = 进入         | —           |
| Map     | 拖拽 = 平移；滚轮 = 缩放；单击建筑 = 详情；双击建筑 = 打开 | ESC = 返回/关闭 |
| Sidebar | hover 文件名 → 建筑高亮；点 sort 切换排序        | —           |


## 美学说明

整体走"老世界地图集 / 探险家手册"路线：

- 深夜蓝海洋 `#0b1426`，米色羊皮纸 `#f5ecd9`
- 暖赭石强调色 `#c9a961`
- Fraunces 斜体作为大标题，呼应古地图字体
- 面板上有重复线条纹理，模拟笔记本横线
- markdown 首段首字母放大成 drop-cap，像古籍

如果想换风格，所有颜色都在 `global.css` 顶部的 `:root` 变量里。





## 笔记图片（Obsidian 语法）

阅读页支持 Obsidian 图片嵌入，文件名可含空格：

```markdown
![[2026 1 23.jpg]]
![[photo.png|图注说明]]
![[photo.png|150]]   # 宽度 150px
```

把所有图片放在 `src/content/notes/attachments/`（全库共用，文件名可含空格）。`attachments` 不会作为大陆出现在 3D 地图上。远程图片也可写完整 URL：`![[https://example.com/x.jpg]]`。

缺失的本地图片会在正文中显示占位图（`public/images/image-missing.png`），并在构建/开发控制台输出警告；请确认文件名与 `![[...]]` 中完全一致（含空格与扩展名）。