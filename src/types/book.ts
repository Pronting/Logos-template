import type { CollectionEntry } from "astro:content";

/**
 * 我对这本书的个人评价。
 */
export type BookRating = "recommended" | "neutral" | "not-recommended";

/**
 * 书籍的元信息（来自 frontmatter）。
 */
export interface BookFrontmatter {
    title: string;
    author: string;
    cover?: string;
    tags: string[];
    rating: BookRating;
    summary?: string;
    /** 一句话简短评价 */
    briefComment?: string;
    readDate?: Date;
    readTimeHours?: number;
    year?: number;
    pinTop?: number;
    draft?: boolean;
}

export type BookEntry = CollectionEntry<"books">;

/** 书评链接（一对多：一本书可有多篇书评） */
export interface BookReviewLink {
    title: string;
    url: string;
    pubDate: Date;
}

/** 书籍基础信息（用于书评页展示关联书籍） */
export interface BookInfo {
    title: string;
    author: string;
    cover: string;
}

/** 传给前端组件使用的轻量元信息 */
export interface BookMeta {
    id: string;
    slug: string;
    title: string;
    author: string;
    cover: string;
    tags: string[];
    rating: BookRating;
    summary: string;
    /** 一句话简短评价 */
    briefComment: string;
    readDate: Date | null;
    readTimeHours: number | null;
    year: number | null;
    pinTop: number;
    /** 关联的书评文章链接 */
    reviewLinks: BookReviewLink[];
}

/** 筛选条件 */
export interface BookFilter {
    q?: string;
    tag?: string | "all";
    rating?: BookRating | "all";
}

/** 所有可用的 rating（固定三个等级） */
export const ALL_BOOK_RATINGS: BookRating[] = [
    "recommended",
    "neutral",
    "not-recommended",
];
