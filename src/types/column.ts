import type { CollectionEntry } from "astro:content";

export type ColumnEntry = CollectionEntry<"columns">;

/** 专栏/文章的扩展类型，包含 fallback 状态 */
export type ColumnEntryWithLocaleStatus = ColumnEntry & {
    isFallback?: boolean;
};

/** 传给前端组件使用的专栏元信息 */
export interface ColumnMeta {
    slug: string;
    title: string;
    description: string;
    icon: string;
    pinTop: number;
    articleCount: number;
}
