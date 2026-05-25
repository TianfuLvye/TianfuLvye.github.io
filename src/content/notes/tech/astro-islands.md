---
title: "Astro 的 Islands 给我的启发"
date: 2025-06-10
summary: "默认零 JS 是一种态度。"
tags: [tech, astro, performance]
---

# Astro 的 Islands 给我的启发

Astro 的核心主张其实只有一句话："默认零 JavaScript"。

听起来反潮流。这个时代不是讲究 SPA 吗，不是讲究 hydration 吗，
不是讲究客户端路由的丝滑过渡吗？

但是 Astro 提醒我，绝大多数页面的绝大多数内容是**不需要交互的**。
博客文章不需要交互，作品集介绍不需要交互，about page 不需要交互。
它们只是文档——HTML 早就把"文档"这件事做得很好了。

只有那些真正需要状态的部分——一个评论框，一个 3D 场景，一个搜索框——
才需要变成"岛屿"，被 hydrate 成 React/Vue/Svelte 组件。

剩下的，就是静态的、轻巧的、可缓存的 HTML。

这种思路对我个人博客特别合适。我的博客 90% 是文字，10% 是这个 3D 世界。
那 90% 应该跑得像 1995 年的网页一样快。
