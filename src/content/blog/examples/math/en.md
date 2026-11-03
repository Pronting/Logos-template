---
title: Math Formula Styles
pubDate: 2026-11-03
slugId: examples/math
description: Use KaTeX for inline equations, display equations, matrices, and piecewise functions.
tags: [Example, KaTeX]
---

The site renders math formulas with KaTeX.

## Inline Formulas

Write an expression between single dollar signs: `$E = mc^2$`.

Rendered output: $E = mc^2$, and $\sum_{i=1}^{n} x_i = X$.

## Display Formulas

Write an expression between two dollar signs:

$$
\frac{\partial}{\partial t}\Psi(\mathbf{r}, t) = \frac{i}{\hbar}H\Psi(\mathbf{r}, t)
$$

## Aligned Formulas

Use the `aligned` environment for multiple aligned lines:

$$
\begin{aligned}
a^2 + b^2 &= c^2 \\
e^{i\pi} + 1 &= 0
\end{aligned}
$$

## Matrices and Piecewise Functions

$$
\begin{pmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{pmatrix}
$$

$$
f(x) = \begin{cases}
x^2 & \text{if } x \geq 0 \\
-x^2 & \text{if } x < 0
\end{cases}
$$
