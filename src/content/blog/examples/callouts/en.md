---
title: Callout Styles
pubDate: 2026-11-03
slugId: examples/callouts
description: Use directive syntax to create several kinds of callout.
tags: [Example, Callout]
---

Callouts wrap their content in `:::`. The directive name determines the icon and color.

## Basic Syntax

````markdown
:::note
This is a note.
:::
````

:::note
This is a note.
:::

```markdown
:::tip
This is a tip.
:::
```

:::tip
This is a tip.
:::

```markdown
:::important
This is important information.
:::
```

:::important
This is important information.
:::

```markdown
:::warning
This is a warning.
:::
```

:::warning
This is a warning.
:::

```markdown
:::caution
This needs careful handling.
:::
```

:::caution
This needs careful handling.
:::

## Multiple Paragraphs

Callouts can contain lists, emphasis, and code.

:::tip
Check these items before publishing:

- Add a title and date
- Review each link
- Run `pnpm build`

**Callout content** supports Markdown syntax.
:::

## Custom Titles

Add a label after the directive name to use a custom title.

````markdown
:::important[Publish Check]
Build the site before committing content.
:::
````

:::important[Publish Check]
Build the site before committing content.
:::
