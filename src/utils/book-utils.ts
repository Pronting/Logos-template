import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { i18n } from "astro:config/client";

import type { BookEntry, BookFilter, BookInfo, BookMeta, BookRating, BookReviewLink } from "@/types/book";

/**
 * 把 CollectionEntry 转成轻量 BookMeta，传给客户端组件。
 */
export function toBookMeta(
    entry: CollectionEntry<"books">,
    reviewLinks?: BookReviewLink[],
): BookMeta {
    const data = entry.data;
    // 处理 tags：支持逗号分隔的标签字符串，如 "心理学,个人成长" → ["心理学", "个人成长"]
    const tags = (data.tags ?? []).flatMap((tag) =>
        tag.split(",").map((t) => t.trim()).filter(Boolean)
    );
    // entry.id = "example-book/zh-cn"，去掉末尾 locale 后缀得到纯目录名 slug
    const parts = entry.id.split("/");
    const slug = parts.length > 1 ? parts.slice(0, -1).join("/") : entry.id;

    return {
        id: entry.id,
        slug,
        title: data.title,
        author: data.author,
        cover: data.cover ?? "",
        tags,
        rating: data.rating,
        summary: data.summary ?? "",
        briefComment: data.briefComment ?? "",
        readDate: data.readDate ?? null,
        readTimeHours: data.readTimeHours ?? null,
        year: data.year ?? null,
        pinTop: data.pinTop ?? 0,
        reviewLinks: reviewLinks ?? [],
    };
}

/**
 * 加载某一语言下的所有书籍。
 * - 默认语言走 fallback 策略
 * - 按 pinTop 降序 + readDate 降序排列
 */
export async function getBooks(lang: string): Promise<BookEntry[]> {
    const targetLang = lang || i18n.defaultLocale;
    const all = await getCollection(
        "books",
        ({ data }) => (import.meta.env.PROD ? data.draft !== true : true),
    );

    const grouped = new Map<string, Record<string, CollectionEntry<"books">>>();
    for (const book of all) {
        const parts = book.id.split("/");
        const fileName = parts[parts.length - 1];
        const id = parts.slice(0, -1).join("/");
        const language: string = fileName.replace(/\.md$/, "");
        if (!grouped.has(id)) grouped.set(id, {});
        grouped.get(id)![language] = book;
    }

    const defaultLang = i18n.defaultLocale;
    const result: CollectionEntry<"books">[] = [];

    for (const [, locales] of grouped) {
        const picked = locales[targetLang] ?? locales[defaultLang];
        if (picked) {
            result.push(picked);
        }
    }

    result.sort((a, b) => {
        const pinA = a.data.pinTop ?? 0;
        const pinB = b.data.pinTop ?? 0;
        if (pinA !== pinB) return pinB - pinA;
        const dateA = a.data.readDate?.valueOf() ?? 0;
        const dateB = b.data.readDate?.valueOf() ?? 0;
        return dateB - dateA;
    });

    return result;
}

/**
 * 加载某一语言下的所有书评文章。
 * 与 getBooks 相同的 locale fallback 策略。
 */
export async function getBookReviews(
    lang: string,
): Promise<CollectionEntry<"bookReview">[]> {
    const targetLang = lang || i18n.defaultLocale;
    const all = await getCollection(
        "bookReview",
        ({ data }) => (import.meta.env.PROD ? data.draft !== true : true),
    );

    const grouped = new Map<string, Record<string, CollectionEntry<"bookReview">>>();
    for (const review of all) {
        const parts = review.id.split("/");
        const fileName = parts[parts.length - 1];
        const id = parts.slice(0, -1).join("/");
        const language: string = fileName.replace(/\.md$/, "");
        if (!grouped.has(id)) grouped.set(id, {});
        grouped.get(id)![language] = review;
    }

    const defaultLang = i18n.defaultLocale;
    const result: CollectionEntry<"bookReview">[] = [];

    for (const [, locales] of grouped) {
        const picked = locales[targetLang] ?? locales[defaultLang];
        if (picked) {
            result.push(picked);
        }
    }

    result.sort((a, b) => {
        const pinA = a.data.pinTop ?? 0;
        const pinB = b.data.pinTop ?? 0;
        if (pinA !== pinB) return pinB - pinA;
        const dateA = a.data.pubDate?.valueOf() ?? 0;
        const dateB = b.data.pubDate?.valueOf() ?? 0;
        return dateB - dateA;
    });

    return result;
}

/**
 * 构建书籍 slug → 书评链接的映射（一对多）。
 * 返回 Map<bookSlug, BookReviewLink[]>
 */
export async function buildBookReviewMap(
    lang: string,
): Promise<Map<string, BookReviewLink[]>> {
    const reviews = await getBookReviews(lang);
    const map = new Map<string, BookReviewLink[]>();

    for (const review of reviews) {
        const slug = review.data.bookSlug;
        if (!slug) continue;
        const links = map.get(slug) ?? [];
        links.push({
            title: review.data.title,
            url: `/book-review/${review.id}`,
            pubDate: review.data.pubDate,
        });
        map.set(slug, links);
    }

    return map;
}

/**
 * 构建书籍 slug → 基础信息的映射。
 * 供书评详情页展示关联书籍的封面、书名、作者。
 */
export async function buildBookInfoMap(
    lang: string,
): Promise<Map<string, BookInfo>> {
    const books = await getBooks(lang);
    const map = new Map<string, BookInfo>();

    for (const book of books) {
        // book.id = "example-book/zh-cn"，需要去掉末尾 locale 后缀
        // 与 bookSlug（纯目录名）对齐
        const parts = book.id.split("/");
        const slug = parts.length > 1 ? parts.slice(0, -1).join("/") : book.id;
        map.set(slug, {
            title: book.data.title,
            author: book.data.author,
            cover: book.data.cover ?? "",
        });
    }

    return map;
}

/**
 * 纯函数：根据筛选条件过滤书籍。
 * 后续扩展（tag 多选 / 排序 / 年份）都挂在这个函数上。
 */
export function filterBooks(books: BookEntry[], filter: BookFilter): BookEntry[] {
    const q = (filter.q ?? "").trim().toLowerCase();
    const tag = filter.tag ?? "all";
    const rating = filter.rating ?? "all";

    return books.filter((book) => {
        const data = book.data;

        if (q) {
            const haystack = `${data.title} ${data.author}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }

        if (tag !== "all") {
            // 展开逗号分隔的标签后再匹配
            const expandedTags = (data.tags ?? []).flatMap((t) =>
                t.split(",").map((s) => s.trim()).filter(Boolean)
            );
            if (!expandedTags.includes(tag)) return false;
        }

        if (rating !== "all" && data.rating !== (rating as BookRating)) {
            return false;
        }

        return true;
    });
}
