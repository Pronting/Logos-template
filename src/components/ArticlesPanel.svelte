<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import Icon from '@iconify/svelte';
  import i18nit from '@i18n/translation';

  export let articles = [];
  export let currentLang = "zh-cn";

  const UNTAGGED = 'undefined';
  const VIEW_STORAGE_KEY = 'articles-view-mode';
  const VIEW_CARD = 'card';
  const VIEW_COMPACT = 'compact';

  function getArticleTags(article) {
    return Array.isArray(article.data.tags) ? article.data.tags : [];
  }

  // 读取本地保存的显示方式，默认完整信息
  function readStoredView() {
    try {
      if (typeof window === 'undefined') return VIEW_CARD;
      return window.localStorage.getItem(VIEW_STORAGE_KEY) === VIEW_COMPACT ? VIEW_COMPACT : VIEW_CARD;
    } catch {
      return VIEW_CARD;
    }
  }

  let selectedTags = [];
  let viewMode = readStoredView();
  const t = i18nit(currentLang);

  function setViewMode(mode) {
    if (viewMode === mode) return;
    viewMode = mode;
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // 忽略隐私模式等存储不可用的情况
    }
  }

  // 统计每个 tag 的文章数量
  $: tagCounts = (() => {
    const counts = new Map();
    for (const article of articles) {
      const tags = getArticleTags(article);
      if (tags.length === 0) {
        counts.set(UNTAGGED, (counts.get(UNTAGGED) || 0) + 1);
      } else {
        for (const tag of tags) {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        }
      }
    }
    return counts;
  })();

  $: sortedTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));

  // 过滤逻辑：文章必须包含所有选中的 tag（AND 条件）
  $: filteredArticles = selectedTags.length > 0
    ? articles.filter(article => {
        const tags = getArticleTags(article);
        if (tags.length === 0) {
          return selectedTags.includes(UNTAGGED);
        }
        return selectedTags.every(t => tags.includes(t));
      })
    : articles;

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('tag');

    if (tagParam === UNTAGGED) {
      selectedTags = [UNTAGGED];
    } else if (tagParam) {
      selectedTags = tagParam.split(',');
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const value = params.get('tag');
      selectedTags = value ? value.split(',') : [];
    };

    window.addEventListener('popstate', handlePopState);

    const syncAsideHeight = () => {
      const mainContent = document.getElementById('articles-content');
      const aside = document.getElementById('articles-tag-sidebar');

      if (mainContent && aside) {
        const mainHeight = mainContent.offsetHeight;
        aside.style.height = `${mainHeight}px`;
      }
    };

    setTimeout(syncAsideHeight, 0);

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncAsideHeight, 100);
    };
    window.addEventListener('resize', handleResize);

    const mainContent = document.getElementById('articles-content');
    let mutationObserver;
    if (mainContent) {
      mutationObserver = new MutationObserver(syncAsideHeight);
      mutationObserver.observe(mainContent, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    }
  });

  function toggleTag(tag) {
    if (tag === null) {
      selectedTags = [];
    } else {
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
      } else {
        selectedTags = [...selectedTags, tag];
      }
    }

    const url = new URL(window.location);
    if (selectedTags.length > 0) {
      url.searchParams.set('tag', selectedTags.join(','));
    } else {
      url.searchParams.delete('tag');
    }
    window.history.replaceState({}, '', url);
  }
</script>

<div class="articles-panel mx-auto w-full max-w-[var(--page-width)]">
  <!-- 标题区域：显示文章总数 -->
  <div class="text-center pt-5 pb-6 max-w-[var(--page-width)] mx-auto md:mt-0 mt-28">
    <p class="text-[var(--text-color)] text-3xl py-5 font-bold">{t("header.articles")}</p>
    <p class="text-[var(--text-color-70)] font-bold">{t("cover.subTitle.articlesCount", { count: filteredArticles.length })}</p>
  </div>

  <!-- 显示方式切换 -->
  <div class="max-w-[var(--page-width)] mx-auto pb-5 flex items-center justify-end">
    <div
      class="inline-flex items-center gap-0.5 rounded-lg border border-[var(--button-border-color)] p-0.5"
      role="group"
      aria-label={t("articles.viewMode")}
    >
      <button
        type="button"
        on:click={() => setViewMode(VIEW_CARD)}
        aria-pressed={viewMode === VIEW_CARD}
        title={t("articles.viewCard")}
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors duration-200 ease-in-out
        {viewMode === VIEW_CARD
          ? 'bg-[var(--link-color)] text-white'
          : 'text-[var(--text-color-70)] hover:text-[var(--link-color)] hover:bg-[var(--button-hover-color)]'}"
      >
        <Icon icon="fa6-solid:table-list" class="text-[11px]" />
        <span>{t("articles.viewCard")}</span>
      </button>
      <button
        type="button"
        on:click={() => setViewMode(VIEW_COMPACT)}
        aria-pressed={viewMode === VIEW_COMPACT}
        title={t("articles.viewCompact")}
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-colors duration-200 ease-in-out
        {viewMode === VIEW_COMPACT
          ? 'bg-[var(--link-color)] text-white'
          : 'text-[var(--text-color-70)] hover:text-[var(--link-color)] hover:bg-[var(--button-hover-color)]'}"
      >
        <Icon icon="fa6-solid:list-ul" class="text-[11px]" />
        <span>{t("articles.viewCompact")}</span>
      </button>
    </div>
  </div>

  <!-- 文章列表 -->
  <div class="pb-16" id="articles-content">
    {#if filteredArticles.length > 0}
      {#if viewMode === VIEW_COMPACT}
        <!-- 紧凑型列表：仅显示标题 -->
        <div class="rounded-xl shadow border border-[var(--button-border-color)] overflow-hidden divide-y divide-[var(--button-border-color)]">
          {#each filteredArticles as article (article.id)}
            <div animate:flip={{ duration: 400 }} in:fade={{ duration: 150 }} out:fade={{ duration: 150 }}>
              <a
                href={article.data.link}
                target="_blank"
                rel="noopener noreferrer"
                title={article.data.title}
                class="group flex items-center gap-2 min-w-0 w-full px-5 py-3 transition-colors duration-200 ease-in-out hover:bg-[var(--button-hover-color)]"
              >
                <span class="flex-1 min-w-0 truncate text-[0.95rem] text-[var(--text-color)] group-hover:text-[var(--link-color)] transition-colors duration-200 ease-in-out">{article.data.title}</span>
                <Icon
                  icon="fa6-solid:arrow-up-right-from-square"
                  class="shrink-0 text-[10px] text-[var(--text-color-70)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                />
              </a>
            </div>
          {/each}
        </div>
      {:else}
      <div class="grid grid-cols-1 gap-6">
        {#each filteredArticles as article (article.id)}
          <div animate:flip={{ duration: 400 }} in:fade={{ duration: 150 }} out:fade={{ duration: 150 }}>
            <div
              class="block min-w-0 w-full max-w-[var(--page-width)] mx-auto rounded-xl shadow border border-[var(--button-border-color)] overflow-hidden"
            >
              {#if article.data.image}
                <a href={article.data.link} target="_blank" rel="noopener noreferrer" class="cover h-60 overflow-hidden hover-scale block">
                  <img src={article.data.image} alt={article.data.title} class="w-full h-full object-cover" loading="lazy" />
                </a>
              {/if}
              <div class="content p-6">
                <a href={article.data.link} target="_blank" rel="noopener noreferrer" class="title text-xl font-semibold text-[var(--text-color)] mb-3 hover:text-[var(--link-color)] active:text-[var(--link-color)] flex items-center group transition-colors duration-300 ease-in-out">
                  <span class="flex items-center">
                    {#if article.data.pinTop > 0}
                      <span class="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 text-xs font-semibold rounded border border-[var(--link-color)] text-[var(--link-color)] bg-[var(--button-hover-color)]">
                        <Icon icon="fluent:pin-24-filled" class="w-3 h-3" />
                        {t("pagecard.pinned")}
                      </span>
                    {/if}
                    {article.data.title}
                  </span>
                  <Icon
                    icon="fa6-solid:arrow-up-right-from-square"
                    class="ml-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform md:translate-x-[-5px] md:group-hover:translate-x-0 transition-all duration-300 ease-in-out text-[var(--text-color)] group-hover:text-[var(--link-color)] group-active:text-[var(--link-color)]"
                  />
                </a>
                {#if article.data.description}
                  <p class="description text-[var(--text-color-70)] leading-relaxed mt-2">
                    {article.data.description}
                  </p>
                {/if}
                <div class="flex items-center justify-start text-sm text-[var(--text-color-70)] mt-4 space-x-4">
                  <p class="pubdate flex items-center whitespace-nowrap">
                    <Icon icon="fa6-solid:calendar-days" class="mr-1" />
                    <span class="py-1 px-1">{new Date(article.data.pubDate).toLocaleDateString(currentLang === 'zh-cn' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                  <a href={article.data.link} target="_blank" rel="noopener noreferrer" class="link-url flex items-center whitespace-nowrap hover:text-[var(--link-color)] transition-colors">
                    <Icon icon="fa6-solid:link" class="mr-1" />
                    <span class="py-1 px-1 truncate max-w-[200px]">{new URL(article.data.link).hostname}</span>
                  </a>
                </div>
                {#if article.data.tags && article.data.tags.length > 0}
                  <div class="flex flex-wrap items-center justify-start text-sm text-[var(--text-color-70)] mt-2 gap-2">
                    <p class="flex items-center whitespace-nowrap mr-2">
                      <Icon icon="fa6-solid:hashtag" class="mr-1" />
                      {#each article.data.tags as tag, i}
                        {#if i > 0}<span class="mx-0.5">·</span>{/if}
                        <span
                          class="tag-pill cursor-pointer"
                          on:click|preventDefault|stopPropagation={() => toggleTag(tag)}
                        >{tag}</span>
                      {/each}
                    </p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
      {/if}
    {:else}
      <div class="text-center py-16 text-[var(--text-color-70)]">
        <p class="text-lg">{t("articles.noResults")}</p>
      </div>
    {/if}
  </div>
</div>

<!-- 标签筛选侧边栏 -->
<aside
  id="articles-tag-sidebar"
  class="hidden lg:block absolute left-[var(--toc-offset-left)] top-70 bottom-0 w-[var(--tag-width)]"
>
  <div class="sticky top-24">
    <div class="flex items-center gap-2 text-[var(--text-color)] font-bold mb-4 border-b border-[var(--button-border-color)] pb-2 uppercase tracking-wider">
      <Icon icon="fa6-solid:hashtag" class="text-xs" />
      <span>{t("tag")}</span>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each sortedTags as { tag, count } (tag)}
        <button
          on:click={() => toggleTag(tag)}
          class="px-3 py-1 text-xs rounded-md transition-all border inline-flex items-center gap-1.5
          {selectedTags.includes(tag)
            ? 'bg-[var(--link-color)] text-white border-[var(--link-color)]'
            : 'hover:border-[var(--link-color)] border-[var(--button-border-color)] text-[var(--text-color)]'}"
        >
          <span>{tag === UNTAGGED ? t("pagecard.uncategorized") : tag}</span>
          <span class="opacity-70 text-[10px] tabular-nums">({count})</span>
        </button>
      {/each}
    </div>
  </div>
</aside>

<style>
  .hover-scale {
    transition: transform 0.3s ease;
  }
  .hover-scale:hover {
    transform: scale(1.05);
  }
  .tag-pill {
    transition: all 0.3s ease;
    background-color: transparent;
    display: inline-block;
    border-radius: 0.25rem;
    padding: 0.25rem 0.25rem;
  }
  .tag-pill:hover {
    color: var(--link-color);
    background-color: var(--button-hover-color);
    text-shadow: 0.5px 0 0 currentColor, -0.5px 0 0 currentColor;
  }
</style>
