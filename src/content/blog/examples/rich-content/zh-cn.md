---
title: 扩展内容样式
pubDate: 2026-11-03
slugId: examples/rich-content
description: 引语卡片、音乐卡片、GitHub 卡片与文字扩展语法。
tags: [示例, 扩展语法]
---

这篇文章展示模板提供的扩展内容写法。

## 引语卡片

```markdown
:::quote
文字可以保存想法，也可以连接读者。

<br><right>—— Logos</right>
:::
```

:::quote
文字可以保存想法，也可以连接读者。

<br><right>—— Logos</right>
:::

## 音乐与 GitHub 卡片

```markdown
::music{id="30431366"}

::github{repo="Pronting/Logos-template"}
```

::music{id="30431366"}

::github{repo="Pronting/Logos-template"}

## 文字扩展语法

```markdown
!!模糊文字!!
==彩虹文字==
++下划线文字++
{拼音}(pīn|yīn)
```

显示效果：!!模糊文字!!、==彩虹文字==、++下划线文字++、{拼音}(pīn|yīn)。

这些写法可以组合使用：!!==带有{拼音}(pīn|yīn)的彩虹文字==!!。
