---
title: 数学公式样式
pubDate: 2026-11-03
slugId: examples/math
description: 使用 KaTeX 编写行内公式、独立公式、矩阵与分段函数。
tags: [示例, KaTeX]
---

网站使用 KaTeX 渲染数学公式。

## 行内公式

将公式写在单个美元符号之间：`$E = mc^2$`。

显示效果：$E = mc^2$，以及 $\sum_{i=1}^{n} x_i = X$。

## 独立公式

将公式写在两个美元符号之间：

$$
\frac{\partial}{\partial t}\Psi(\mathbf{r}, t) = \frac{i}{\hbar}H\Psi(\mathbf{r}, t)
$$

## 对齐公式

使用 `aligned` 环境可以对齐多行内容：

$$
\begin{aligned}
a^2 + b^2 &= c^2 \\
e^{i\pi} + 1 &= 0
\end{aligned}
$$

## 矩阵与分段函数

$$
\begin{pmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{pmatrix}
$$

$$
f(x) = \begin{cases}
x^2 & \text{当 } x \geq 0 \\
-x^2 & \text{当 } x < 0
\end{cases}
$$
