---
title: Markdown 基础样式
pubDate: 2026-11-03
slugId: examples/markdown-basics
description: 标题、文本、引用、代码、列表、表格与任务清单的写法。
tags: [示例, Markdown]
---

这篇文章用于展示日常写作最常用的 Markdown 语法。将内容保存为 `.md` 文件后，网站会在构建时生成页面。

## 标题与段落

使用井号表示标题层级：

```markdown
# 一级标题
## 二级标题
### 三级标题
```

段落之间保留一个空行。需要手动换行时，在行尾写入两个空格。

## 文本样式

```markdown
**加重文字**
*强调文字*
~~删除线~~
`行内代码`
```

显示效果：**加重文字**、*强调文字*、~~删除线~~与 `行内代码`。

## 引用与代码

```markdown
> 引用内容可以用来标记补充说明。
```

> 引用内容可以用来标记补充说明。

使用三个反引号包围代码，并在开头指定语言：

````markdown
```typescript
const title = 'Logos';
console.log(title);
```
````

```typescript
const title = 'Logos';
console.log(title);
```

## 列表与任务清单

```markdown
1. 编写内容
2. 填写文章信息
3. 运行构建命令

- [x] 创建 Markdown 文件
- [ ] 修改为自己的内容
```

1. 编写内容
2. 填写文章信息
3. 运行构建命令

- [x] 创建 Markdown 文件
- [ ] 修改为自己的内容

## 链接与表格

链接写法为 `[显示文字](https://example.com)`。例如：[Astro](https://astro.build)。

```markdown
| 名称 | 用途 |
| --- | --- |
| `title` | 页面标题 |
| `pubDate` | 发布日期 |
| `slugId` | 文章标识 |
```

| 名称 | 用途 |
| --- | --- |
| `title` | 页面标题 |
| `pubDate` | 发布日期 |
| `slugId` | 文章标识 |

更多展示效果可与提示框、数学公式和扩展语法文章配合使用。
