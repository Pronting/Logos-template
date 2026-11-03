# 内容元信息使用指南

每篇内容使用 Markdown 文件保存。文件开头两个 `---` 之间的 YAML 内容称为 frontmatter，用来填写标题、日期、标签等元信息；第二个 `---` 之后编写正文。

```markdown
---
title: 我的文章
pubDate: 2026-11-03
slugId: my-post
tags: [学习, 笔记]
---

这里是正文。
```

日期使用不带引号的 `YYYY-MM-DD`，例如 `2026-11-03`。布尔值使用 `true` 或 `false`，数字不加引号，标签使用数组，例如 `[阅读, 技术]`。涉及冒号等特殊字符的文字可以使用引号。

## 文件与语言

每条内容通常有独立目录，中文文件命名为 `zh-cn.md`，英文文件命名为 `en.md`。例如：

- `src/content/blog/my-post/zh-cn.md`
- `src/content/blog/my-post/en.md`

同一目录下的语言文件属于同一条内容。英文内容缺失时，相关页面会使用默认语言的内容。修改字段定义需要查看 `src/content.config.ts`。

## 通用字段

下列字段是否必填以各内容类型的说明为准。

- `title`：标题，必填。
- `description`：简介，省略时为空。
- `pubDate`：发布日期。文章、书评和外部文章必填；专栏与 Harness Kit 可选。
- `tags`：标签数组，例如 `[阅读, 成长]`。书籍至少填写一个标签。
- `draft`：草稿开关，默认 `false`。设置为 `true` 后，生产构建不显示该语言文件对应的内容。
- `pinTop`：排序数值，默认 `0`。数值越大，列表中越靠前；专栏文章按照发布日期排序。
- `image`、`cover`：图片地址。文章和书评页面使用 `cover`，未填写时使用 `image`；列表与其他内容类型的图片用途见下文。
- `showCover`：文章、书评或专栏文章页面是否显示封面，默认 `true`。设置为 `false` 可以隐藏正文前的封面。

文章和书评的本地封面可以填写与 Markdown 文件同目录的文件名，例如 `cover: "./cover.jpg"`，也可以填写完整的 HTTP 或 HTTPS 图片地址。书籍封面和外部文章图片直接作为图片地址使用；放在 `public` 目录时填写以 `/` 开头的路径，例如 `/images/book.jpg`。

## 博客文章

位置：`src/content/blog/<文章目录>/zh-cn.md`。

```yaml
---
title: 我的第一篇文章
pubDate: 2026-11-03
slugId: my-first-post
description: 介绍文章的主要内容。
tags: [学习, 笔记]
image: "./cover.jpg"
cover: "./cover.jpg"
showCover: true
pinTop: 1
draft: false
---
```

必填字段：`title`、`pubDate`、`slugId`。目录名称决定文章路径，例如 `my-first-post` 对应 `/blog/my-first-post`；`slugId` 用于评论标识，建议为每篇文章填写稳定且唯一的值。文章列表与正文页面均优先使用 `cover`，未填写时使用 `image`。

## 书籍

位置：`src/content/books/<书籍目录>/zh-cn.md`。

```yaml
---
title: 示例书籍
author: 示例作者
tags: [阅读, 成长]
rating: recommended
cover: /images/book.jpg
summary: 这本书的简介。
briefComment: 读完后的简短评价。
readDate: 2026-11-03
readTimeHours: 1.5
year: 2020
pinTop: 1
draft: false
---
```

必填字段：`title`、`author`、`tags`、`rating`。`rating` 可填写 `recommended`、`neutral` 或 `not-recommended`，分别对应推荐、中庸和不行。

`summary` 是简介，`briefComment` 是短评。`readDate` 是阅读日期；`readTimeHours` 以小时为单位，可以填写非负小数，例如 `1.5` 表示一个半小时；`year` 为整数年份。书架按照 `pinTop` 和 `readDate` 排序。

## 书评

位置：`src/content/book-review/<书评目录>/zh-cn.md`。

```yaml
---
title: 示例书评
pubDate: 2026-11-03
bookSlug: example-book
rating: recommended
description: 这篇书评的简介。
tags: [阅读, 书评]
image: "./cover.jpg"
showCover: true
pinTop: 0
draft: false
---
```

必填字段：`title`、`pubDate`、`bookSlug`。`bookSlug` 填写 `src/content/books/` 下的书籍目录名称，例如 `example-book`。关联后，书籍详情可以显示对应书评，书评页面也可以显示关联书籍。`rating` 可选，取值与书籍相同。

## 专栏与专栏文章

专栏介绍和文章使用同一个 `columns` 内容集合。专栏介绍放在 `src/content/columns/<专栏目录>/zh-cn.md`：

```yaml
---
title: 我的专栏
description: 专栏内容介绍。
icon: fa6-solid:book-open
tags: [学习]
pinTop: 1
draft: false
---
```

专栏文章放在 `src/content/columns/<专栏目录>/<文章目录>/zh-cn.md`：

```yaml
---
title: 专栏文章
pubDate: 2026-11-03
description: 文章简介。
tags: [笔记]
showCover: true
draft: false
---
```

`title` 必填。`description`、`pubDate`、`icon`、`image`、`cover`、`showCover`、`tags`、`pinTop` 和 `draft` 可选；`pinTop` 需要填写整数。专栏列表按 `pinTop` 排序，专栏文章按 `pubDate` 排序，因此建议为每篇专栏文章填写发布日期。`icon` 使用项目支持的 Iconify 图标名称。

## 外部文章

位置：`src/content/articles/<条目目录>/zh-cn.md`。

```yaml
---
title: 值得阅读的文章
link: https://example.com/article
pubDate: 2026-11-03
description: 这篇文章的简要介绍。
image: /images/article.jpg
tags: [收藏]
pinTop: 0
draft: false
---
```

必填字段：`title`、`link`、`pubDate`。`link` 必须是完整 URL，点击卡片会打开该地址；`image` 是卡片图片地址。`pinTop` 需要填写整数。

## Harness Kit

位置：`src/content/harness/<条目目录>/zh-cn.md`。也可以使用单文件，例如 `src/content/harness/my-tool.md`。

```yaml
---
title: 工具名称
description: 这个工具的用途。
type: skill
link: https://example.com/tool
source: GitHub
author: 作者名称
version: "1.0.0"
icon: fa6-solid:wand-magic-sparkles
tags: [工具, 示例]
pubDate: 2026-11-03
pinTop: 0
draft: false
---
```

只有 `title` 必填。`type` 支持 `skill`、`command`、`agent`、`mcp`、`prompt`、`workflow` 和 `other`；省略或填写未识别的类型时归入 `other`。`link` 是访问地址，`source` 是来源名称，`author` 和 `version` 分别记录作者与版本；`icon` 可填写图标名称。`pinTop` 需要填写整数。

## 关于与友情链接页面

`src/content/spec/about/` 和 `src/content/spec/friends/` 下的语言文件保存页面正文。头像、个人介绍、社交链接与友情链接数据在 `src/config.ts` 中配置。

## 检查内容

保存文件后运行 `pnpm dev` 查看页面，运行 `pnpm build` 检查生产构建。字段缺失、日期格式不正确或数值类型不符合要求时，内容校验会报告错误。
