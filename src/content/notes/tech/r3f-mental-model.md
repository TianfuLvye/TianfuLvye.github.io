---
title: "React Three Fiber 的心智模型"
date: 2025-08-21
summary: "为什么把 Three.js 包成 React 反而更顺手了。"
tags: [tech, react, threejs]
---

# React Three Fiber 的心智模型

刚接触 R3F 的时候我有点抗拒。Three.js 本来就够复杂，
为什么还要在外面再套一层 React？多此一举吧。

写了几个 demo 之后，我改变想法了。

R3F 真正做对的事情，是把 Three.js 的**命令式 API** 翻译成了**声明式场景树**。
你不再需要手动 `add` / `remove` / `dispose`，
你只需要描述"此刻这个世界长什么样"，框架负责差分。

这和 React 之于 DOM 是同一件事。当年我们也觉得 jQuery 挺好用的，
直到组件多起来，状态多起来，手动同步变成了噩梦。

3D 场景的复杂度增长更快——
一个有十几个交互对象的场景，命令式写法几乎必然导致内存泄漏或者引用错乱。

声明式不是为了"看起来优雅"，是为了**让正确性变得便宜**。
