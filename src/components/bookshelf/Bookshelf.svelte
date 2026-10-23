<script lang="ts">
  import type { BookMeta, BookRating } from "@/types/book";
  import { untrack } from "svelte";
  import BookCard from "./BookCard.svelte";
  import BookFilters from "./BookFilters.svelte";
  import BookDetail from "./BookDetail.svelte";

  interface Props {
    books: BookMeta[];
  }

  let { books }: Props = $props();

  let q = $state("");
  let tag = $state<string | "all">("all");
  let rating = $state<BookRating | "all">("all");
  let selectedBook = $state<BookMeta | null>(null);

  const filtered = $derived(
    books.filter((book) => {
      if (q.trim()) {
        const haystack = `${book.title} ${book.author}`.toLowerCase();
        if (!haystack.includes(q.trim().toLowerCase())) return false;
      }
      if (tag !== "all" && !book.tags.includes(tag)) return false;
      if (rating !== "all" && book.rating !== (rating as BookRating)) return false;
      return true;
    }),
  );

  // 按领域分组：同一个 tag 下的书籍放在一块
  const grouped = $derived(() => {
    const tagMap = new Map<string, BookMeta[]>();
    const untagged: BookMeta[] = [];

    for (const book of filtered) {
      if (book.tags.length === 0) {
        untagged.push(book);
        continue;
      }
      for (const t of book.tags) {
        const list = tagMap.get(t) ?? [];
        list.push(book);
        tagMap.set(t, list);
      }
    }

    // 按组内书籍数量降序
    const groups = [...tagMap.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([domain, books]) => ({ domain, books }));

    if (untagged.length > 0) {
      groups.push({ domain: "未分类", books: untagged });
    }

    return groups;
  });

  const i18n = {
    searchPlaceholder: "搜索书名或作者...",
    filterTag: "领域",
    filterRating: "评价",
    ratingRecommended: "推荐",
    ratingNeutral: "中庸",
    ratingNotRecommended: "不行",
    ratingAll: "全部",
    tagAll: "全部",
    close: "关闭",
    readDate: "阅读时间",
    readTime: "阅读时长",
    year: "年份",
    author: "作者",
    summary: "简介",
    reviewArticle: "书评文章",
    briefComment: "简短评价",
    noResults: "未找到相关书籍",
    noReview: "暂无书评",
    readReview: "阅读书评",
    statsRead: "本已读",
    statsRecommended: "本推荐",
    statsDomains: "个领域",
  };

  function handleSelect(book: BookMeta) {
    selectedBook = book;
  }

  function handleCloseDetail() {
    selectedBook = null;
    // 关闭弹窗时清除 URL 中的 ?book= 参数
    const url = new URL(window.location.href);
    if (url.searchParams.has("book")) {
      url.searchParams.delete("book");
      window.history.replaceState({}, "", url.toString());
    }
  }

  // 挂载时检测 ?book= 参数，自动打开对应书籍详情（仅执行一次）
  $effect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookSlug = params.get("book");
    if (bookSlug) {
      untrack(() => {
        const match = books.find((b) => b.slug === bookSlug);
        if (match) {
          selectedBook = match;
        }
      });
    }
  });
</script>

<div class="space-y-6">
  <BookFilters
    books={books}
    bind:q
    bind:tag
    bind:rating
    searchPlaceholder={i18n.searchPlaceholder}
    filterTag={i18n.filterTag}
    filterRating={i18n.filterRating}
    ratingRecommended={i18n.ratingRecommended}
    ratingNeutral={i18n.ratingNeutral}
    ratingNotRecommended={i18n.ratingNotRecommended}
    ratingAll={i18n.ratingAll}
    tagAll={i18n.tagAll}
    statsRead={i18n.statsRead}
    statsRecommended={i18n.statsRecommended}
    statsDomains={i18n.statsDomains}
  />

  {#if filtered.length === 0}
    <p class="text-center text-[var(--text-color-70)] py-16">{i18n.noResults}</p>
  {:else}
    {#each grouped() as group (group.domain)}
      <div class="space-y-4">
        <h2 class="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
          <span class="w-1 h-5 bg-[var(--link-color)] rounded-full"></span>
          {group.domain}
          <span class="text-sm font-normal text-[var(--text-color-70)]">({group.books.length})</span>
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {#each group.books as book (book.id)}
            <BookCard book={book} onselect={handleSelect} />
          {/each}
        </div>
      </div>
    {/each}
  {/if}

  {#if selectedBook}
    <BookDetail
      book={selectedBook}
      onclose={handleCloseDetail}
      closeLabel={i18n.close}
      readDateLabel={i18n.readDate}
      readTimeLabel={i18n.readTime}
      yearLabel={i18n.year}
      authorLabel={i18n.author}
      summaryLabel={i18n.summary}
      briefCommentLabel={i18n.briefComment}
      reviewArticleLabel={i18n.reviewArticle}
      ratingRecommended={i18n.ratingRecommended}
      ratingNeutral={i18n.ratingNeutral}
      ratingNotRecommended={i18n.ratingNotRecommended}
      noReviewLabel={i18n.noReview}
      readReviewLabel={i18n.readReview}
    />
  {/if}
</div>
