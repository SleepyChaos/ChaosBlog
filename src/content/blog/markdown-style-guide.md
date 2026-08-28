---
title: Markdown 排版效果一览
description: 一篇用来检验博客排版样式的示例文章:标题、列表、引用、代码、表格、图片一应俱全。
pubDate: 2026-08-27
tags: [技术, 写作]
---

这篇文章集中展示了博客支持的 Markdown 元素,方便检查排版效果,也当作用法速查。

## 文本样式

普通文本支持 **加粗**、*斜体*、~~删除线~~、`行内代码`,以及[链接](https://astro.build)。

## 列表

无序列表:

- 第一项
- 第二项
  - 嵌套项 A
  - 嵌套项 B
- 第三项

有序列表:

1. 写一篇 Markdown
2. git push
3. 自动部署上线

## 引用

> 设计不只是看起来如何、摸起来如何,设计是它如何运作。
>
> —— Steve Jobs

## 代码块

行内代码如 `npm run dev`。代码块带语法高亮,支持暗色模式自动切换:

```js
// Fibonacci:简洁的递归与记忆化
const memo = new Map();
function fib(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const value = fib(n - 1) + fib(n - 2);
  memo.set(n, value);
  return value;
}

console.log(fib(40)); // 102334155
```

```bash
# 常用命令
npm run dev      # 本地开发
npm run build    # 构建生产版本
```

## 表格

| 语法 | 用途 | 示例 |
| --- | --- | --- |
| `**文字**` | 加粗 | **文字** |
| `*文字*` | 斜体 | *文字* |
| `` `文字` `` | 行内代码 | `文字` |

## 图片

![占位示意图](/ChaosBlog/images/placeholder.svg)

## 分隔线与脚注

---

以上就是目前博客支持的排版元素。写作愉快!
