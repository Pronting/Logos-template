import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { i18n } from "astro:config/client";

/**
 * 获取排序后的博客条目
 * @param filter 过滤函数，可选，默认过滤掉生产环境中的草稿文章
 * @param sort 排序函数，可选，默认按置顶优先（pinTop 降序），再按发布日期降序
 * @returns 排序后的博客条目数组
 */
// 1. 定义一个扩展类型，包含 fallback 状态
export type BlogEntryWithLocaleStatus = CollectionEntry<'blog'> & {
  isFallback?: boolean;
};

export async function getBlogEntrySort(
  lang: string,
  filter?: (entry: CollectionEntry<'blog'>) => boolean | undefined,
  sort?: (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) => number
): Promise<BlogEntryWithLocaleStatus[]> { // 修改返回类型
  
  const defaultFilter = ({ data }: CollectionEntry<'blog'>) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  };

  const defaultSort = (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) => {
    const pinTopA = a.data.pinTop ?? 0;
    const pinTopB = b.data.pinTop ?? 0;
    if (pinTopA > 0 && pinTopB > 0) return pinTopB - pinTopA;
    if (pinTopA > 0) return -1;
    if (pinTopB > 0) return 1;
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  };

  const blogEntries = await getCollection('blog', filter || defaultFilter);

  const grouped = new Map<string, Record<string, CollectionEntry<'blog'>>>();
  const defaultLanguage = i18n.defaultLocale;

  for (const post of blogEntries) {
    const parts = post.id.split('/');
    const fileName = parts[parts.length - 1];
    const id = parts.slice(0, -1).join('/');
    const language: string = fileName.replace('.md', '');

    if (!grouped.has(id)) {
      grouped.set(id, {});
    }
    grouped.get(id)![language] = post;
  }

  const selectedEntries: BlogEntryWithLocaleStatus[] = [];
  
  for (const [id, translations] of grouped.entries()) {
    let selectedPost: CollectionEntry<'blog'> | undefined;
    let isFallback = false; // 默认为 false
    
    if (lang && lang !== defaultLanguage) {
      if (translations[lang]) {
        selectedPost = translations[lang];
      } else if (translations[defaultLanguage]) {
        // --- 关键修改点：触发回退逻辑 ---
        selectedPost = translations[defaultLanguage];
        isFallback = true; 
      }
    } else {
      if (translations[defaultLanguage]) {
        selectedPost = translations[defaultLanguage];
      }
    }
    
    if (selectedPost) {
      selectedEntries.push({
        ...selectedPost,
        id: id,
        isFallback: isFallback // 将状态注入对象
      });
    }
  }

  return selectedEntries.sort(sort || defaultSort);
}

export async function getSpec(
    lang: string,
    spec: string
) {
    const defaultLanguage = i18n.defaultLocale;
    let collection = await getEntry('spec', `${spec}/${lang}`)
    if(!collection) collection = await getEntry('spec', `${spec}/${defaultLanguage}`);
    return collection;
}

/**
 * 获取排序后的文章条目（好文推荐）
 * @param lang 当前语言
 * @param filter 过滤函数，可选
 * @param sort 排序函数，可选
 * @returns 排序后的文章条目数组
 */
export type ArticleEntryWithLocaleStatus = CollectionEntry<'articles'> & {
  isFallback?: boolean;
};

export async function getArticles(
  lang: string,
  filter?: (entry: CollectionEntry<'articles'>) => boolean | undefined,
  sort?: (a: CollectionEntry<'articles'>, b: CollectionEntry<'articles'>) => number
): Promise<ArticleEntryWithLocaleStatus[]> {
  const defaultFilter = ({ data }: CollectionEntry<'articles'>) => {
    return import.meta.env.PROD ? data.draft !== true : true;
  };

  const defaultSort = (a: CollectionEntry<'articles'>, b: CollectionEntry<'articles'>) => {
    const pinTopA = a.data.pinTop ?? 0;
    const pinTopB = b.data.pinTop ?? 0;
    if (pinTopA > 0 && pinTopB > 0) return pinTopB - pinTopA;
    if (pinTopA > 0) return -1;
    if (pinTopB > 0) return 1;
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  };

  const articleEntries = await getCollection('articles', filter || defaultFilter);

  const grouped = new Map<string, Record<string, CollectionEntry<'articles'>>>();
  const defaultLanguage = i18n.defaultLocale;

  for (const article of articleEntries) {
    const parts = article.id.split('/');
    const fileName = parts[parts.length - 1];
    const id = parts.slice(0, -1).join('/');
    const language: string = fileName.replace('.md', '');

    if (!grouped.has(id)) {
      grouped.set(id, {});
    }
    grouped.get(id)![language] = article;
  }

  const selectedEntries: ArticleEntryWithLocaleStatus[] = [];

  for (const [id, translations] of grouped.entries()) {
    let selectedArticle: CollectionEntry<'articles'> | undefined;
    let isFallback = false;

    if (lang && lang !== defaultLanguage) {
      if (translations[lang]) {
        selectedArticle = translations[lang];
      } else if (translations[defaultLanguage]) {
        selectedArticle = translations[defaultLanguage];
        isFallback = true;
      }
    } else {
      if (translations[defaultLanguage]) {
        selectedArticle = translations[defaultLanguage];
      }
    }

    if (selectedArticle) {
      selectedEntries.push({
        ...selectedArticle,
        id: id,
        isFallback: isFallback
      });
    }
  }

  return selectedEntries.sort(sort || defaultSort);
}
export interface ContributionDay {
  date: string;
  count: number;
}

/**
 * 汇总所有内容类型 pubDate 按日计数，用于热力图。
 */
export async function getContributionData(lang: string): Promise<ContributionDay[]> {
  const { getBookReviews } = await import('@utils/book-utils');
  const { getAllColumnArticles } = await import('@utils/column-utils');

  const [blogEntries, bookReviews, colArticles, articles] = await Promise.all([
    getBlogEntrySort(lang),
    getBookReviews(lang),
    getAllColumnArticles(lang).catch(() => [] as { data: { pubDate?: Date } }[]),
    getArticles(lang),
  ]);

  const countMap = new Map<string, number>();
  for (const entry of [...blogEntries, ...bookReviews, ...colArticles, ...articles]) {
    const pubDate = (entry as { data: { pubDate?: Date } }).data.pubDate;
    if (!pubDate) continue;
    const key = pubDate instanceof Date
      ? pubDate.toISOString().slice(0, 10)
      : String(pubDate).slice(0, 10);
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  const result: ContributionDay[] = [];
  for (const [date, count] of countMap) result.push({ date, count });
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

/**
 * 汇总全站文章数量与字数，用于 Hero 区域数字展示。
 * 聚合四个集合（blog / articles / columnArticles / bookReview）。
 * 字数：直接对每条 entry 的原始 markdown `body` 跑 `reading-time`，
 * 避免依赖 `render()` 阶段才挂载的 `remarkPluginFrontmatter` 字段。
 * 各集合内部已自行处理 locale fallback，本函数只做合并。
 */
export interface SiteTotals {
  articleCount: number;
  totalWords: number;
}

export async function getSiteTotals(lang: string): Promise<SiteTotals> {
  const { getBookReviews } = await import('@utils/book-utils');
  const { getAllColumnArticles } = await import('@utils/column-utils');
  const getReadingTime = (await import('reading-time')).default;

  const [blogEntries, articles, columnArticles, bookReviews] = await Promise.all([
    getBlogEntrySort(lang),
    getArticles(lang),
    getAllColumnArticles(lang).catch(
      () => [] as { body?: string }[]
    ),
    getBookReviews(lang),
  ]);

  const all = [...blogEntries, ...articles, ...columnArticles, ...bookReviews];
  const articleCount = all.length;
  const totalWords = all.reduce((sum, entry) => {
    const body = (entry as { body?: string }).body ?? "";
    if (!body) return sum;
    return sum + (getReadingTime(body).words ?? 0);
  }, 0);

  return { articleCount, totalWords };
}
