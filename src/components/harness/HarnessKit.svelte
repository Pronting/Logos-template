<script lang="ts">
  import Icon from '@iconify/svelte';
  import { HARNESS_TYPES, HARNESS_TYPE_ICONS } from '@/types/harness';
  import type { HarnessItem, HarnessType } from '@/types/harness';

  export interface HarnessLabels {
    searchPlaceholder: string;
    filterType: string;
    typeAll: string;
    empty: string;
    emptyHint: string;
    noResults: string;
    docs: string;
    types: Record<HarnessType, string>;
  }

  interface Props {
    items: HarnessItem[];
    labels: HarnessLabels;
  }

  let { items, labels }: Props = $props();

  let q = $state('');
  let type = $state<HarnessType | 'all'>('all');

  const typeCounts = $derived(
    HARNESS_TYPES
      .map((t) => ({ type: t, count: items.filter((item) => item.type === t).length }))
      .filter((entry) => entry.count > 0)
  );

  const filtered = $derived(
    items.filter((item) => {
      if (type !== 'all' && item.type !== type) return false;
      if (q.trim()) {
        const haystack = `${item.title} ${item.description} ${item.tags.join(' ')} ${item.author} ${item.source}`.toLowerCase();
        if (!haystack.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    })
  );

  function toggleType(t: HarnessType | 'all') {
    type = type === t ? 'all' : t;
  }
</script>

{#if items.length === 0}
  <!-- 还没有内容时的占位：先把结构与分类立起来 -->
  <div class="rounded-2xl border border-dashed border-[var(--button-border-color)] px-6 py-20 text-center">
    <span class="mx-auto mb-5 flex w-14 h-14 items-center justify-center rounded-2xl bg-[var(--link-color)]/10 text-[var(--link-color)]">
      <Icon icon="fa6-solid:toolbox" class="w-6 h-6" />
    </span>
    <p class="text-[var(--text-color)] text-lg font-bold">{labels.empty}</p>
    <p class="text-sm text-[var(--text-color-70)] mt-2">{labels.emptyHint}</p>
    <div class="flex flex-wrap justify-center gap-2 mt-6">
      {#each HARNESS_TYPES as t (t)}
        <span class="px-3 py-1 text-xs rounded-md border border-[var(--button-border-color)] text-[var(--text-color-70)]">
          {labels.types[t]}
        </span>
      {/each}
    </div>
  </div>
{:else}
  <div class="space-y-5 mb-8">
    <input
      type="search"
      bind:value={q}
      placeholder={labels.searchPlaceholder}
      class="w-full px-4 py-2.5 rounded-lg border border-[var(--button-border-color)] bg-[var(--bg-color)] text-[var(--text-color)] placeholder:text-[var(--text-color-70)] focus:outline-none focus:ring-2 focus:ring-[var(--link-color)] transition-all text-sm"
    />

    <div>
      <div class="flex items-center gap-2 text-[var(--text-color)] font-bold mb-2.5 text-xs uppercase tracking-wider">
        {labels.filterType}
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          onclick={() => toggleType('all')}
          class="px-2.5 py-1 text-xs rounded-md transition-all duration-200 border inline-flex items-center gap-1
          {type === 'all'
            ? 'bg-[var(--link-color)] text-white border-[var(--link-color)] shadow-sm'
            : 'hover:border-[var(--link-color)] hover:text-[var(--link-color)] border-[var(--button-border-color)] text-[var(--text-color-70)]'}"
        >
          {labels.typeAll}
        </button>
        {#each typeCounts as { type: t, count } (t)}
          <button
            type="button"
            onclick={() => toggleType(t)}
            class="px-2.5 py-1 text-xs rounded-md transition-all duration-200 border inline-flex items-center gap-1
            {type === t
              ? 'bg-[var(--link-color)] text-white border-[var(--link-color)] shadow-sm'
              : 'hover:border-[var(--link-color)] hover:text-[var(--link-color)] border-[var(--button-border-color)] text-[var(--text-color-70)]'}"
          >
            <span>{labels.types[t]}</span>
            <span class="opacity-60 text-[10px] tabular-nums">({count})</span>
          </button>
        {/each}
      </div>
    </div>
  </div>

  {#if filtered.length === 0}
    <p class="text-center text-[var(--text-color-70)] py-16">{labels.noResults}</p>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
      {#each filtered as item (item.id)}
        <div class="flex flex-col gap-3 p-5 rounded-xl border border-[var(--button-border-color)] shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--link-color)]">
          <div class="flex items-start gap-3">
            <span class="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--link-color)]/10 text-[var(--link-color)]">
              <Icon icon={item.icon || HARNESS_TYPE_ICONS[item.type]} class="w-5 h-5" />
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-[var(--text-color)] leading-snug break-words">{item.title}</h3>
              <div class="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                <span class="px-1.5 py-0.5 rounded border border-[var(--link-color)] text-[var(--link-color)]">
                  {labels.types[item.type]}
                </span>
                {#if item.version}
                  <span class="text-[var(--text-color-70)]">v{item.version}</span>
                {/if}
                {#if item.author}
                  <span class="text-[var(--text-color-70)]">{item.author}</span>
                {/if}
              </div>
            </div>
          </div>

          {#if item.description}
            <p class="text-sm text-[var(--text-color-70)] leading-relaxed">{item.description}</p>
          {/if}

          {#if item.tags.length > 0}
            <div class="flex flex-wrap gap-1.5 text-[11px] text-[var(--text-color-70)]">
              {#each item.tags as tag (tag)}
                <span class="px-1.5 py-0.5 rounded bg-[var(--button-hover-color)]">#{tag}</span>
              {/each}
            </div>
          {/if}

          {#if item.link}
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              class="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-[var(--link-color)] hover:underline"
            >
              {item.source || labels.docs}
              <Icon icon="fa6-solid:arrow-up-right-from-square" class="text-[10px]" />
            </a>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}
