---
title: Rich Content Styles
pubDate: 2026-11-03
slugId: examples/rich-content
description: Quote cards, music cards, GitHub cards, and extended text syntax.
tags: [Example, Rich Content]
---

This article demonstrates the template's extended content syntax.

## Quote Cards

```markdown
:::quote
Writing preserves ideas and connects readers.

<br><right>— Logos</right>
:::
```

:::quote
Writing preserves ideas and connects readers.

<br><right>— Logos</right>
:::

## Music and GitHub Cards

```markdown
::music{id="30431366"}

::github{repo="Pronting/Logos-template"}
```

::music{id="30431366"}

::github{repo="Pronting/Logos-template"}

## Extended Text Syntax

```markdown
!!Blurred text!!
==Rainbow text==
++Underlined text++
{拼音}(pīn|yīn)
```

Rendered output: !!blurred text!!, ==rainbow text==, ++underlined text++, and {拼音}(pīn|yīn).

These forms can be combined: !!==rainbow text with {拼音}(pīn|yīn)==!!.
