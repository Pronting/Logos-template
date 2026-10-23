import { i18n } from "astro:config/client";

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}
/**
 * 构建完整的URL路径
 * @param path - 需要拼接的路径片段
 * @returns 返回拼接后的完整URL路径
 */
export function baseUrl(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}

/**
 * 通用内容封面图 URL 构造。
 * 支持图床链接（直接返回）、相对路径（相对于 markdown 文件所在目录）。
 * @param imagePath frontmatter 中的 image 字段
 * @param entryId 条目的 id（如 "flyd/zh-cn"）
 * @param collection 内容集合名称（如 "blog"、"book-review"）
 * @returns 相对于 src 目录的图片路径
 */
export function contentCoverUrl(imagePath: string, entryId: string, collection: string): string {
    if (!imagePath) return '';

    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // 处理相对路径 ./ 开头的情况
    if (imagePath.startsWith('./')) {
        imagePath = imagePath.substring(2);
    }

    // 移除可能的前导斜杠
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

    // entryId 如 "flyd/zh-cn" → 去掉末尾 locale 后缀得到目录路径
    const parts = entryId.split('/');
    const dirPath = parts.length > 1 ? parts.slice(0, -1).join('/') : entryId;

    return joinUrl("content/", collection, dirPath, normalizedPath);
}

/**
 * 将相对于content/blog目录的路径转换为相对于src目录的路径
 * @param contentPath 相对于content/blog目录的路径
 * @param blogName 博客文章的名称/ID，用于构建完整路径
 * @returns 相对于src目录的路径
 */
export function blogCoverUrl(contentPath: string, blogName: string): string {
    if (!contentPath) return '';
    if (contentPath.startsWith('http')) return contentPath;
    if (contentPath.startsWith('./')) contentPath = contentPath.substring(2);
    const normalizedPath = contentPath.startsWith('/') ? contentPath.slice(1) : contentPath;
    return joinUrl("content/blog/", blogName, normalizedPath);
}

export function getRelativeLocaleUrl(lang: string, path: string) : string { 
    const prefixDefaultLocale = i18n.routing.prefixDefaultLocale;
    if(prefixDefaultLocale) {
        return joinUrl("/", lang, path);
    }else {
        if(lang === i18n.defaultLocale) return joinUrl("/", path);
        return joinUrl("/", lang, path);
    }
}