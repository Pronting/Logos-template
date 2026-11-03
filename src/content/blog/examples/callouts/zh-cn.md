---
title: 提示框样式
pubDate: 2026-11-03
slugId: examples/callouts
description: 使用 directive 语法编写不同类型的提示框。
tags: [示例, 提示框]
---

提示框使用 `:::` 包围内容。名称决定图标和颜色。

## 基本写法

````markdown
:::note
这是提示内容。
:::
````

:::note
这是提示内容。
:::

```markdown
:::tip
这是建议内容。
:::
```

:::tip
这是建议内容。
:::

```markdown
:::important
这是重要事项。
:::
```

:::important
这是重要事项。
:::

```markdown
:::warning
这是警告内容。
:::
```

:::warning
这是警告内容。
:::

```markdown
:::caution
这是需要谨慎处理的内容。
:::
```

:::caution
这是需要谨慎处理的内容。
:::

## 多段内容

提示框可以包含列表、强调文字与代码。

:::tip
发布文章前可以检查以下项目：

- 填写标题和日期
- 检查链接地址
- 运行 `pnpm build`

**提示信息**也可以包含 Markdown 语法。
:::

## 自定义标题

在名称后加入方括号可以自定义标题。

````markdown
:::important[发布检查]
构建完成后再提交内容。
:::
````

:::important[发布检查]
构建完成后再提交内容。
:::
