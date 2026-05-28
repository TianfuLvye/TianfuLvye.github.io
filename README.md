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
├── astro.config.mjs              # Astro + React；remark/rehype（Obsidian、KaTeX）
├── scripts/
│   └── sync-note-attachments.mjs # dev/build 前同步 attachments
├── public/
│   ├── images/                   # 静态资源（如缺失图片占位）
│   └── models/
│       ├── ATTRIBUTION.md        # GLB 来源说明
│       ├── buildings/
│       └── decorations/
└── src/
    ├── config/
    │   ├── building-catalog.ts   # 建筑 GLB 注册（体量档、权重、footprint）
    │   └── decoration-catalog.ts # 装饰 GLB 注册
    ├── content.config.ts         # content collection schema（含可选 building）
    ├── env.d.ts
    ├── content/notes/
    │   ├── attachments/          # 全库图片/PDF（Obsidian ![[...]]，不参与 3D 地图）
    │   ├── travel/               # 大陆 = 第一层文件夹
    │   ├── tech/
    │   ├── journal/
    │   ├── thoughts/
    │   ├── test/
    │   └── Classnotes/           # 可含子文件夹（如 z大三/）
    ├── components/
    │   ├── World.tsx             # 总入口：Canvas / 视图切换 / 转场
    │   ├── Globe.tsx             # 3D 地球 + 大陆长方体
    │   ├── MapView.tsx           # 2.5D 正交地图、灯光、建筑与装饰
    │   ├── GlTFModel.tsx         # GLB 加载、归一化缩放、高亮、pick 体积
    │   ├── DecorationModel.tsx
    │   ├── MapModelPreload.tsx   # 按大陆预加载 GLB
    │   ├── TagBridgePaths.tsx    # tag 木板路 / 彩虹桥 3D
    │   ├── BridgeTagInfoDock.tsx # 选中桥后底部 tag 信息条
    │   ├── CloudTransition.tsx   # globe ↔ map 云朵转场
    │   ├── DetailsPanel.tsx      # 右侧滑出详情
    │   ├── Sidebar.tsx           # 文件列表、sort、tag paths 开关
    │   └── HUD.tsx               # 顶部面包屑 + 帮助
    ├── layouts/
    │   ├── BaseLayout.astro
    │   └── NoteLayout.astro
    ├── lib/
    │   ├── types.ts
    │   ├── map-config.ts         # 地图尺寸、间距、建筑/装饰缩放系数
    │   ├── note-size.ts          # 字数分档、侧栏字数格式化
    │   ├── random.ts             # mulberry32 + FNV-1a 种子
    │   ├── build-tree.ts         # content → WorldTree + tagBridges
    │   ├── layout.ts             # 球面大陆 / 平面建筑摆放
    │   ├── pick-building-model.ts
    │   ├── tag-bridges.ts        # tag 树选边、桥型
    │   ├── tag-bridge-animation.ts
    │   ├── plank-bridge.ts       # 桥曲线、木板几何、桥廊 hit
    │   ├── bridge-tag-info.ts    # 桥选中后 tag 分组文案
    │   ├── note-metadata.ts
    │   ├── content-paths.ts
    │   ├── remark-obsidian-images.ts
    │   └── remark-obsidian-wikilinks.ts
    ├── pages/
    │   ├── index.astro           # 3D 世界
    │   └── notes/[...slug].astro
    ├── store.ts                  # zustand：视图、选中笔记/桥、tag paths
    └── styles/global.css
```

## 已实现（MVP 范围）

- 3D 地球 + 自动生成的长方体大陆（位置基于固定种子）
- 拖拽旋转 / 鼠标滚轮缩放
- 单击大陆显示名称气泡 + 笔记计数
- 双击大陆 → 云朵转场 → 进入 2.5D 地图
- 2.5D 正交投影地图；建筑位置由 `(continentId + noteId)` 种子摆放，**永远稳定**
- **建筑样式（用哪座 GLB）**：frontmatter `building: <id>` 优先；否则按**正文字数**分档（不足 200 → small；200–2999 → medium；3000 及以上 → large），在对应档的模型池里按 `note.id` 种子随机选一个（见 `building-catalog.ts`）
- **建筑在地图上的大小**：正文字数越大，均匀缩放越大；再乘以 catalog 里的 `footprint` 与全局系数（`map-config.ts`）
- 单击建筑 → 右侧详情面板滑出
- 双击建筑 → 跳转到 markdown 阅读页
- 右侧文件列表显示**字数**；hover 文件名 → 建筑高亮
- sort_by 模式：所有建筑升空成浮岛，下挂铭牌，pattern 承托
- ESC 返回 / 关闭面板
- 低多边形 GLB 装饰（树、草、花、石头等），按大陆种子散布；种类与 footprint 见 `decoration-catalog.ts`
- **tag 木板路**：同大陆内按 tag 生成树连通（k−1 条桥）；优先连近距离、每建筑 ≤3 条边；共享 2/3+ tag 为双色/彩虹桥；固定宽度等距木板（数量随桥长）；纵梁/桩；Sidebar「tag paths」开关

## 留待之后（未做）

- 子地图（子文件夹）—— MVP 内未实现
- 文章 wikilink 在地图上以路径连接（tag 木板路已实现）
- 移动端触控优化
- WebGL 后处理：grain / vignette / bloom
- markdown 渲染插件（代码高亮、表格、脚注 等）

## 交互速查


| 视图      | 鼠标                                  | 键盘          |
| ------- | ----------------------------------- | ----------- |
| Globe   | 拖拽 = 旋转；单击大陆 = 聚焦；双击大陆 = 进入         | —           |
| Map     | 拖拽 = 平移；滚轮 = 缩放；单击建筑 = 详情；双击建筑 = 打开；单击空地 = 取消选中 | ESC = 返回/关闭 |
| Map（tag paths 开） | 悬停桥身 = 高亮桥；单击桥 = 选中，底部 dock 显示共享 tag；dock 内 hover 某 tag 行 = 高亮该 tag 下所有建筑；再点同一座桥或空地 = 取消选中 | —           |
| Sidebar | hover 文件名 → 建筑高亮；点 sort 切换排序；**tag paths** = 显示/隐藏木板桥 | —           |


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