<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import Icon from '@iconify/svelte';
  import i18nit from '@i18n/translation';
  import { formatMonthDay } from '@/utils/time'
  import { getRelativeLocaleUrl } from '@utils/url-utils';

  export let sortedPosts = [];
  export let currentLang = "zh-cn";
  export let defaultLocale = "zh-cn";

  // 哨兵值：表示该文章无任何 tag
  const UNTAGGED = 'undefined';

  /**
   * 获取单篇文章的 tag 列表。
   * - 兼容旧数据：tags 缺失时返回空
   * - 空数组也归一为空，由调用方决定如何处理 UNTAGGED
   */
  function getPostTags(post) {
    return Array.isArray(post.data.tags) ? post.data.tags : [];
  }

  let selectedTags = [];
  const t = i18nit(currentLang);

  // 统计每个 tag 的文章数量，并按数量降序排列
  // 当数量相同时，按 tag 名称 localeCompare 升序作为稳定排序
  $: tagCounts = (() => {
    const counts = new Map();
    for (const post of sortedPosts) {
      const tags = getPostTags(post);
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
  $: filteredPosts = selectedTags.length > 0
    ? sortedPosts.filter(post => {
        const tags = getPostTags(post);
        // 无 tag 的文章只在用户选中 UNTAGGED 时被保留
        if (tags.length === 0) {
          return selectedTags.includes(UNTAGGED);
        }
        return selectedTags.every(t => tags.includes(t));
      })
    : sortedPosts;

  // 按年份分组逻辑
  $: postsByYear = filteredPosts.reduce((acc, post) => {
    const year = new Date(post.data.pubDate).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  $: years = Object.keys(postsByYear).sort((a, b) => b - a);

  onMount(() => {
    // 获取初始 URL 参数 - 特殊处理 UNTAGGED
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('tag');

    if (tagParam === UNTAGGED) {
      selectedTags = [UNTAGGED];
    } else if (tagParam) {
      selectedTags = tagParam.split(',');
    }

    // 处理浏览器前进/后退
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const value = params.get('tag');
      selectedTags = value ? value.split(',') : [];
    };

    window.addEventListener('popstate', handlePopState);

    const syncAsideHeight = () => {
      const mainContent = document.getElementById('archive-content');
      const aside = document.getElementById('tag-sidebar');

      if (mainContent && aside) {
        const mainHeight = mainContent.offsetHeight;
        aside.style.height = `${mainHeight}px`;

      }
    };

    // 使用 setTimeout 确保 DOM 已完全渲染（特别是异步加载内容时）
    setTimeout(syncAsideHeight, 0);

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncAsideHeight, 100);
    };
    window.addEventListener('resize', handleResize);

    const mainContent = document.getElementById('archive-content');
    let mutationObserver;
    if (mainContent) {
      mutationObserver = new MutationObserver(syncAsideHeight);
      mutationObserver.observe(mainContent, {
        childList: true,    // 监听子节点增删
        subtree: true,      // 监听后代节点
        attributes: false,  // 不需要监听属性变化（性能优化）
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

  // 筛选点击逻辑
  function toggleTag(tag) {
    if (tag === null) {
      selectedTags = []; // 点击"全部"则清空
    } else {
      if (selectedTags.includes(tag)) {
        // 如果已选中，则移除
        selectedTags = selectedTags.filter(t => t !== tag);
      } else {
        // 如果未选中，则添加
        selectedTags = [...selectedTags, tag];
      }
    }

    // 更新 URL，方便分享和刷新
    const url = new URL(window.location);
    if (selectedTags.length > 0) {
      url.searchParams.set('tag', selectedTags.join(','));
    } else {
      url.searchParams.delete('tag');
    }
    window.history.replaceState({}, '', url);
  }

</script>

<div class="archives mx-auto w-full max-w-[var(--page-width)]">
    <div class="text-center pt-5 pb-10 max-w-[var(--page-width)] mx-auto md:mt-0 mt-28">
        <p class="text-[var(--text-color)] text-3xl py-5 font-bold">{t("header.archive")}</p>
        <p class="text-[var(--text-color-70)] font-bold">{t("cover.subTitle.archive", {count: filteredPosts.length})}</p>
    </div>

    <div class="py-6 mx-auto text-[var(--text-color)]" id="archive-content">
        {#each years as year (year)}
            <div class="mb-8">
                <h2 class="text-2xl font-bold my-4 text-[var(--text-color)] flex items-center gap-3">
                    <span class="w-1 h-6 bg-[var(--link-color)] rounded-full"></span>
                    {year}
                    <span class="year-count text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--button-hover-color)] text-[var(--text-color-70)] border border-[var(--button-border-color)] transition-all duration-200 hover:bg-[var(--link-color)] hover:text-white hover:border-[var(--link-color)] cursor-default">
                        {postsByYear[year].length}篇
                    </span>
                </h2>
                <div class="space-y-2">
                    {#each postsByYear[year] as post (post.id)}
                        <div animate:flip={{ duration: 600 }} in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} >
                            <a
                                href={getRelativeLocaleUrl(currentLang, `${post.urlPrefix || "/blog/"}${post.id}`)}
                                class="flex items-center gap-4 active:bg-[var(--button-hover-color)] hover:bg-[var(--button-hover-color)] p-2 rounded transition-all duration-200 group"
                            >
                                <span class="text-[var(--text-color-70)] min-w-[80px] md:min-w-[120px]">
                                    {formatMonthDay(post.data.pubDate, currentLang)}
                                </span>

                                <span class="text-lg group-hover:pl-2 group-hover:text-[var(--link-color)] group-hover:font-bold transition-all duration-200 flex-1 group-active:text-[var(--link-color)]">
                                    {#if (post.data.pinTop ?? 0) > 0}
                                        <span class="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 text-xs font-semibold rounded border border-[var(--link-color)] text-[var(--link-color)] bg-[var(--button-hover-color)]">
                                            <Icon icon="fluent:pin-24-filled" class="w-3 h-3" />
                                            {t("pagecard.pinned")}
                                        </span>
                                    {/if}
                                    {post.data.title}
                                    {#if post.isFallback}
                                        <span class="inline-block px-1 ml-2 text-xs font-mono uppercase bg-[var(--button-hover-color)] rounded border border-[var(--button-border-color)]">
                                            {defaultLocale}
                                        </span>
                                    {/if}
                                </span>

                                <span class="hidden md:flex items-center font-mono text-sm text-[var(--text-color-70)] flex-wrap gap-1 justify-end">
                                    <Icon icon="fa6-solid:hashtag" class="mr-1" />
                                    {#each getPostTags(post) as tag, i (tag + i)}
                                        {#if i > 0}<span class="mx-0.5">·</span>{/if}
                                        <span>{tag}</span>
                                    {:else}
                                        <span>{t("pagecard.uncategorized")}</span>
                                    {/each}
                                </span>
                            </a>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

    <aside
        id="tag-sidebar"
        class="hidden lg:block absolute left-[var(--toc-offset-left)] top-70 bottom-0 w-[var(--tag-width)]">
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
