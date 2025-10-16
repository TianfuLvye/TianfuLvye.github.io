---
tags:
  - 教程
  - AI
categories: 教程
---
## 第一步

`_includes/head/custom.html` 文件中加入 MathJax 脚本，如果没有这个文件或者文件夹，就新建一个

```html
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true
    },
    svg: { fontCache: 'global' }
  };
</script>
<script id="MathJax-script" async
  src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
</script>

```

新建 `/_includes/footer/custom.html`

```html
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true
    },
    svg: { fontCache: 'global' }
  };
</script>
<script id="MathJax-script" async
  src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
</script>

```

## 第二步

在`_config.yml`中显式写上 kramdown 和 math 引擎，让 Markdown 生成对 MathJax 友好的占位。

```yaml
markdown: kramdown
kramdown:
  input: GFM
  math_engine: mathjax
  math_engine_opts: {}

```

再改动这个`include`。

```yaml
include:

- _pages

- _includes
```
