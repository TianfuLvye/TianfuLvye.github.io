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
│       ├── decorations/
│       └── road_components/      # 马路 GLB 拼块（直/弯/T/十字/端点）
└── src/
    ├── config/
    │   ├── building-catalog.ts   # 建筑 GLB 注册（体量档、权重、footprint）
    │   ├── decoration-catalog.ts # 装饰 GLB 注册
    │   └── road-catalog.ts       # 马路拼块 GLB 注册
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
    │   ├── MapTerrain.tsx        # 小岛地形：草地平台、四边礁石/沙滩、海水
    │   ├── GlTFModel.tsx         # GLB 加载、归一化缩放、高亮、pick 体积
    │   ├── DecorationModel.tsx
    │   ├── MapModelPreload.tsx   # 按大陆预加载 GLB
    │   ├── InstancedRoadTiles.tsx   # tag 马路 GLB 实例化渲染
    │   ├── InstancedDecorations.tsx # 装饰实例化
    │   ├── InstancedGltfMeshes.tsx  # 共享 GLB 实例批渲染
    │   ├── GridDebugToggle.tsx      # 地图细网格调试线开关
    │   ├── CloudTransition.tsx   # globe ↔ map 云朵转场
    │   ├── DetailsPanel.tsx      # 右侧滑出详情
    │   ├── Sidebar.tsx           # 文件列表、sort、tag chip 筛选
    │   └── HUD.tsx               # 顶部面包屑 + 帮助
    ├── layouts/
    │   ├── BaseLayout.astro
    │   └── NoteLayout.astro
    ├── lib/
    │   ├── types.ts
    │   ├── map-config.ts         # 地图尺寸、间距、建筑/装饰缩放系数、地形常量
    │   ├── reef-zones.ts         # 四边礁石/沙滩裙边几何
    │   ├── note-size.ts          # 字数分档、侧栏字数格式化
    │   ├── random.ts             # mulberry32 + FNV-1a 种子
    │   ├── build-tree.ts         # content → WorldTree
    │   ├── build-tag-graph.ts    # 同 tag 笔记生成 spanning tree 边
    │   ├── layout.ts             # 球面大陆 / 网格建筑摆放
    │   ├── grid.ts               # 地图细网格、占用、寻路辅助
    │   ├── place-continent-layout.ts  # 建筑 + tag 马路预计算
    │   ├── place-roads.ts        # tag 边 → 网格寻路马路段
    │   ├── road-tiles.ts         # 路径格 → 直/弯/T/十字/端点 GLB
    │   ├── place-decorations.ts  # 装饰与森林散布
    │   ├── forest-zones.ts       # 森林区域（椭圆/带状）选取
    │   ├── gltf-layout.ts
    │   ├── pick-building-model.ts
    │   ├── note-metadata.ts
    │   ├── content-paths.ts
    │   ├── remark-obsidian-images.ts
    │   └── remark-obsidian-wikilinks.ts
    ├── pages/
    │   ├── index.astro           # 3D 世界
    │   └── notes/[...slug].astro
    ├── store.ts                  # zustand：视图、选中笔记、activeTags、网格调试
    └── styles/global.css
```

## 已实现（MVP 范围）

- 3D 地球 + 自动生成的长方体大陆（位置基于固定种子）
- 拖拽旋转 / 鼠标滚轮缩放
- 单击大陆显示名称气泡 + 笔记计数
- 双击大陆 → 云朵转场 → 进入 2.5D 地图
- 2.5D 正交投影地图；建筑在细网格上占据 N×N 块，摆放顺序与位置由 `(continentId + noteId)` 种子决定，**永远稳定**
- **建筑样式（用哪座 GLB）**：frontmatter `building: <id>` 优先；否则按**正文字数**分档（不足 200 → small；200–2999 → medium；3000 及以上 → large），在对应档的模型池里按 `note.id` 种子随机选一个（见 `building-catalog.ts`）
- **建筑在地图上的大小**：正文字数越大，均匀缩放越大；再乘以 catalog 里的 `footprint` 与全局系数（`map-config.ts`）
- 单击建筑 → 右侧详情面板滑出
- 双击建筑 → 跳转到 markdown 阅读页
- 右侧文件列表显示**字数**；hover 文件名 → 建筑高亮
- sort_by 模式：所有建筑升空成浮岛，下挂铭牌，pattern 承托
- ESC 返回 / 关闭面板
- 低多边形 GLB 装饰（树、草、花、石头等），含按大陆种子选取的森林区域（椭圆/带状）内密集树木；种类与 footprint 见 `decoration-catalog.ts`
- **tag 马路**：同大陆内每个 tag 对带该 tag 的笔记生成 spanning tree（k−1 条边），优先连近距离；建筑间用 BFS 在细网格上寻路并避开建筑占格；Sidebar 点选 tag chip 后，在对应路径上铺 GLB 拼块（直/弯/T 字/十字/端点），同格多 tag 合并拓扑；`InstancedRoadTiles` 实例化渲染
- 地图视图右上角「grid」开关可显示细网格调试线
- **小岛地形**：地图为抬升的四棱台——顶面 `#80a334` 平地（y=10），四边灰褐礁石（y=10→4）与米色沙滩（y=4→0），外围静态海水 `#197cad`（y=0）；尺寸与 `map-config.ts` 中的 `TERRAIN_*` 常量联动

## 留待之后（未做）

- 子地图（子文件夹）—— MVP 内未实现
- 文章 wikilink 在地图上以路径连接（tag 木板路已实现）
- 移动端触控优化
- WebGL 后处理：grain / vignette / bloom
- markdown 渲染插件（代码高亮、表格、脚注 等）

## 交互速查


| 视图               | 鼠标                                                                                         | 键盘          |
| ---------------- | ------------------------------------------------------------------------------------------ | ----------- |
| Globe            | 拖拽 = 旋转；单击大陆 = 聚焦；双击大陆 = 进入                                                                | —           |
| Map              | 拖拽 = 平移；滚轮 = 缩放；单击建筑 = 详情；双击建筑 = 打开；单击空地 = 取消选中                                            | ESC = 返回/关闭 |
| Map（tag paths 开） | 悬停桥身 = 高亮桥；单击桥 = 选中，底部 dock 显示共享 tag；dock 内 hover 某 tag 行 = 高亮该 tag 下所有建筑；再点同一座桥或空地 = 取消选中 | —           |
| Sidebar          | hover 文件名 → 建筑高亮；点 sort 切换排序；**tag paths** = 显示/隐藏木板桥                                      | —           |


## 美学说明

整体走"老世界地图集 / 探险家手册"路线：

- 深夜蓝海洋 `#0b1426`（地球视图）；地图视图为海水色 `#197cad`
- 米色羊皮纸 `#f5ecd9`
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