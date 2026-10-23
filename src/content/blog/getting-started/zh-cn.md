---
title: 开始使用 Logos
pubDate: 2026-10-23
slugId: getting-started
description: 配置网站、编写文章和使用 Markdown 的示例。
tags: [使用指南]
---

## 配置网站

修改 `src/config.ts` 中的网站名称、个人介绍和评论设置。修改 `src/config/hero.ts` 中的首页文字，并在 `astro.config.mjs` 中填写网站地址。

## 编写文章

在 `src/content/blog/` 中创建文章目录，使用 `zh-cn.md` 保存中文内容，使用 `en.md` 保存英文内容。每篇文章需要填写 `title`、`pubDate` 和 `slugId`。

## Markdown 示例

支持 **加重文字**、*强调文字*、列表、代码和数学公式。

```typescript
const greeting = 'Hello, Logos';
console.log(greeting);
```

公式示例：$E = mc^2$。

:::note
将 `draft` 设置为 `true` 可以在生产构建中隐藏文章。源文件的访问权限由仓库设置决定。
:::
