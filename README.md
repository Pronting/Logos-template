# Logos

基于 Astro、Svelte 和 Tailwind CSS 的博客模板，提供中文与英文路由、文章、书架、书评、专栏、搜索、数学公式与 Markdown 扩展。

## 使用方法

通过 GitHub 的 Use this template 创建自己的仓库，安装 Node.js 22 与 pnpm 10，执行以下命令：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

生产构建使用 `pnpm build`，输出目录为 `dist/`。本地预览使用 `pnpm preview`。

## 网站配置

| 文件 | 配置内容 |
| --- | --- |
| `src/config.ts` | 网站名称、个人介绍、评论、友情链接 |
| `src/config/hero.ts` | 首页标题与按钮 |
| `astro.config.mjs` | 网站域名与语言 |
| `src/styles/` | 样式 |
| `src/content.config.ts` | 内容字段与校验规则 |

评论与访问统计默认关闭。启用评论前需要填写自己的服务地址。

## 内容示例

`src/content/` 提供各类内容的示例：`blog` 保存文章，`books` 保存书籍，`book-review` 保存书评，`columns` 保存专栏，`articles` 保存外部文章链接，`harness` 保存工具介绍，`spec` 保存关于与友情链接页面。

目录中的 `zh-cn.md` 与 `en.md` 对应不同语言。书评的 `bookSlug` 对应书籍目录。专栏目录中的语言文件提供专栏介绍，文章目录位于专栏目录内部。

使用 `draft: true` 隐藏生产页面中的草稿。需要保护文章源文件时，应将个人网站仓库设置为私有。

## 自动检查与部署

提交代码后，GitHub Actions 自动运行测试和生产构建。将 `dist/` 上传到自己的静态网站服务即可发布。Docker 部署可以使用项目中的 `Dockerfile`。

AI 摘要通过 `pnpm ai:summary` 单独生成，需要配置模型服务凭据；常规构建无需这些凭据。凭据保存在环境变量或私有仓库的 Secrets 中。

## 更新框架

框架功能在此仓库维护。个人博客可以将此仓库添加为 `upstream`，通过 `git fetch upstream` 获取更新，再选择需要的框架提交。个人文章、图片、配置与部署文件在个人仓库维护。

此仓库具有独立的 Git 历史，初次接入已有博客时需要逐项检查框架文件。后续选择具体的框架提交更新，保留个人内容与配置。

## 来源与许可

Logos 基于 Motues/Momo 开发。原项目的许可声明保存在 `LICENSE` 中。
