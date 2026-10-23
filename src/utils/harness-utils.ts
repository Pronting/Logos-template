import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { i18n } from "astro:config/client";

import { HARNESS_TYPES } from "@/types/harness";
import type { HarnessItem, HarnessType } from "@/types/harness";

function normalizeType(value?: string): HarnessType {
    return HARNESS_TYPES.includes(value as HarnessType) ? (value as HarnessType) : "other";
}

/**
 * 读取 Harness Kit 条目。
 * 支持两种组织方式：
 *   - src/content/harness/<slug>/<lang>.md（多语言，缺失语言时回退到默认语言）
 *   - src/content/harness/<slug>.md（单文件，直接作为默认语言条目）
 */
export async function getHarnessItems(lang: string): Promise<HarnessItem[]> {
    const defaultLanguage = i18n!.defaultLocale;

    const entries = await getCollection(
        "harness",
        ({ data }) => (import.meta.env.PROD ? data.draft !== true : true)
    );

    const grouped = new Map<string, Record<string, CollectionEntry<"harness">>>();

    for (const entry of entries) {
        const parts = entry.id.split("/");
        const fileName = parts[parts.length - 1];
        const isFlat = parts.length === 1;
        const id = isFlat ? fileName : parts.slice(0, -1).join("/");
        const language = isFlat ? defaultLanguage : fileName.replace(/\.md$/, "");

        if (!grouped.has(id)) {
            grouped.set(id, {});
        }
        grouped.get(id)![language] = entry;
    }

    const items: HarnessItem[] = [];

    for (const [id, translations] of grouped.entries()) {
        const entry =
            lang && lang !== defaultLanguage
                ? (translations[lang] ?? translations[defaultLanguage])
                : translations[defaultLanguage];

        if (!entry) continue;

        const data = entry.data;

        items.push({
            id,
            title: data.title,
            description: data.description ?? "",
            type: normalizeType(data.type),
            tags: (data.tags ?? [])
                .flatMap((tag) => tag.split(",").map((t) => t.trim()))
                .filter(Boolean),
            link: data.link ?? "",
            source: data.source ?? "",
            author: data.author ?? "",
            version: data.version ?? "",
            icon: data.icon ?? "",
            pubDate: data.pubDate ? data.pubDate.toISOString() : null,
            pinTop: data.pinTop ?? 0,
        });
    }

    return items.sort(
        (a, b) =>
            b.pinTop - a.pinTop ||
            (b.pubDate ?? "").localeCompare(a.pubDate ?? "") ||
            a.title.localeCompare(b.title)
    );
}
