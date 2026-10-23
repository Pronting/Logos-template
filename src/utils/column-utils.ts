import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { i18n } from "astro:config/client";
import type { ColumnEntryWithLocaleStatus, ColumnMeta } from '@/types/column';

// ── 路径深度判断 ──
// columns 集合的 ID 由 generateId 生成，格式为相对路径去掉 .md：
//   元数据：dev-log/zh-cn          (2 段)
//   文章：  dev-log/first-post/zh-cn (3 段)

function isColumnMeta(id: string): boolean {
    return id.split('/').length === 2;
}

function isColumnArticle(id: string): boolean {
    return id.split('/').length >= 3;
}

/** 从文章 ID 提取所属专栏 slug，如 "dev-log/first-post/zh-cn" → "dev-log" */
function extractColumnSlug(articleId: string): string {
    const parts = articleId.split('/');
    return parts.slice(0, -2).join('/');
}

// ── locale 解析 ──

type Entry = CollectionEntry<'columns'>;

function resolveColumnMetaLocale(
    entries: Entry[],
    lang: string,
): ColumnEntryWithLocaleStatus[] {
    const defaultLang = i18n!.defaultLocale;
    const grouped = new Map<string, Record<string, Entry>>();

    for (const e of entries) {
        // "dev-log/zh-cn" → groupKey="dev-log", locale="zh-cn"
        const parts = e.id.split('/');
        const locale = parts[parts.length - 1];
        const groupKey = parts.slice(0, -1).join('/');
        if (!grouped.has(groupKey)) grouped.set(groupKey, {});
        grouped.get(groupKey)![locale] = e;
    }

    const result: ColumnEntryWithLocaleStatus[] = [];
    for (const [groupKey, translations] of grouped) {
        const picked = pickLocale(translations, lang, defaultLang);
        if (picked.entry) {
            result.push({ ...picked.entry, id: groupKey, isFallback: picked.isFallback });
        }
    }
    return result;
}

function resolveArticleLocale(
    entries: Entry[],
    lang: string,
): ColumnEntryWithLocaleStatus[] {
    const defaultLang = i18n!.defaultLocale;
    const grouped = new Map<string, Record<string, Entry>>();

    for (const e of entries) {
        // "dev-log/first-post/zh-cn" → groupKey="dev-log/first-post", locale="zh-cn"
        const parts = e.id.split('/');
        const locale = parts[parts.length - 1];
        const groupKey = parts.slice(0, -1).join('/');
        if (!grouped.has(groupKey)) grouped.set(groupKey, {});
        grouped.get(groupKey)![locale] = e;
    }

    const result: ColumnEntryWithLocaleStatus[] = [];
    for (const [groupKey, translations] of grouped) {
        const picked = pickLocale(translations, lang, defaultLang);
        if (picked.entry) {
            // groupKey = "dev-log/first-post"，去掉专栏前缀得到文章 slug "first-post"
            // 路由需要的是纯文章 slug，不含专栏目录前缀
            const articleSlug = groupKey.split('/').slice(1).join('/');
            result.push({ ...picked.entry, id: articleSlug, isFallback: picked.isFallback });
        }
    }
    return result;
}

function pickLocale(
    translations: Record<string, Entry>,
    lang: string,
    defaultLang: string,
): { entry: Entry | undefined; isFallback: boolean } {
    if (lang && lang !== defaultLang) {
        if (translations[lang]) return { entry: translations[lang], isFallback: false };
        if (translations[defaultLang]) return { entry: translations[defaultLang], isFallback: true };
    }
    return { entry: translations[defaultLang], isFallback: false };
}

// ── 公开接口 ──

/** 获取排序后的专栏元数据列表 */
export async function getColumns(
    lang: string,
    sort?: (a: ColumnEntryWithLocaleStatus, b: ColumnEntryWithLocaleStatus) => number,
): Promise<ColumnEntryWithLocaleStatus[]> {
    const all = await getCollection('columns', ({ data }) =>
        import.meta.env.PROD ? data.draft !== true : true,
    );
    const metas = all.filter(e => isColumnMeta(e.id));

    const defaultSort = (a: ColumnEntryWithLocaleStatus, b: ColumnEntryWithLocaleStatus) => {
        const pinA = a.data.pinTop ?? 0;
        const pinB = b.data.pinTop ?? 0;
        if (pinA !== pinB) return pinB - pinA;
        return a.data.title.localeCompare(b.data.title);
    };

    const resolved = resolveColumnMetaLocale(metas, lang);
    return resolved.sort(sort || defaultSort);
}

/** 获取指定专栏下的所有文章 */
export async function getColumnArticles(
    lang: string,
    columnSlug: string,
    sort?: (a: ColumnEntryWithLocaleStatus, b: ColumnEntryWithLocaleStatus) => number,
): Promise<ColumnEntryWithLocaleStatus[]> {
    const all = await getCollection('columns', ({ data }) =>
        import.meta.env.PROD ? data.draft !== true : true,
    );
    const articles = all.filter(e =>
        isColumnArticle(e.id) && extractColumnSlug(e.id) === columnSlug,
    );

    const defaultSort = (a: ColumnEntryWithLocaleStatus, b: ColumnEntryWithLocaleStatus) => {
        return (b.data.pubDate?.valueOf() ?? 0) - (a.data.pubDate?.valueOf() ?? 0);
    };

    const resolved = resolveArticleLocale(articles, lang);
    return resolved.sort(sort || defaultSort);
}

/** 获取所有专栏下的全部文章（用于归档页等跨专栏场景） */
export async function getAllColumnArticles(
    lang: string,
): Promise<(ColumnEntryWithLocaleStatus & { columnSlug: string })[]> {
    const columns = await getColumns(lang);
    const result: (ColumnEntryWithLocaleStatus & { columnSlug: string })[] = [];

    for (const col of columns) {
        const articles = await getColumnArticles(lang, col.id);
        for (const article of articles) {
            result.push({ ...article, columnSlug: col.id });
        }
    }

    return result;
}

/** 获取所有专栏的元信息（用于侧边栏展示） */
export async function getColumnsMeta(lang: string): Promise<ColumnMeta[]> {
    const columns = await getColumns(lang);
    const result: ColumnMeta[] = [];

    for (const col of columns) {
        const articles = await getColumnArticles(lang, col.id);
        result.push({
            slug: col.id,
            title: col.data.title,
            description: col.data.description,
            icon: col.data.icon || 'fa6-solid:folder-open',
            pinTop: col.data.pinTop ?? 0,
            articleCount: articles.length,
        });
    }

    return result;
}
