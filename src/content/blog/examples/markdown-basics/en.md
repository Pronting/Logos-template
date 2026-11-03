---
title: Markdown Basics
pubDate: 2026-11-03
slugId: examples/markdown-basics
description: Headings, text, quotes, code, lists, tables, and task lists.
tags: [Example, Markdown]
---

This article demonstrates the Markdown syntax used most often in a post. Save content as a `.md` file and the site will create its page during the build.

## Headings and Paragraphs

Use hash symbols for heading levels:

```markdown
# Level One
## Level Two
### Level Three
```

Leave one blank line between paragraphs. Add two spaces at the end of a line for a manual line break.

## Text Styles

```markdown
**Bold text**
*Italic text*
~~Strikethrough~~
`Inline code`
```

Rendered output: **Bold text**, *italic text*, ~~strikethrough~~, and `inline code`.

## Quotes and Code

```markdown
> A quote can provide supporting context.
```

> A quote can provide supporting context.

Wrap a code block in three backticks and name its language:

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

## Lists and Task Lists

```markdown
1. Write content
2. Fill in post metadata
3. Run the build command

- [x] Create the Markdown file
- [ ] Replace the example text
```

1. Write content
2. Fill in post metadata
3. Run the build command

- [x] Create the Markdown file
- [ ] Replace the example text

## Links and Tables

Links use `[label](https://example.com)`, for example [Astro](https://astro.build).

```markdown
| Name | Purpose |
| --- | --- |
| `title` | Page title |
| `pubDate` | Publication date |
| `slugId` | Post identifier |
```

| Name | Purpose |
| --- | --- |
| `title` | Page title |
| `pubDate` | Publication date |
| `slugId` | Post identifier |

Use the callout, math, and rich-content examples to see more display options.
