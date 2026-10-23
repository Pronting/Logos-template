<script lang="ts">
  import type { BookMeta, BookRating } from "@/types/book";
  import Icon from "@iconify/svelte";

  interface Props {
    book: BookMeta | null;
    closeLabel: string;
    readDateLabel: string;
    readTimeLabel: string;
    yearLabel: string;
    authorLabel: string;
    summaryLabel: string;
    briefCommentLabel: string;
    reviewArticleLabel: string;
    ratingRecommended: string;
    ratingNeutral: string;
    ratingNotRecommended: string;
    noReviewLabel: string;
    readReviewLabel: string;
    onclose: () => void;
  }

  let {
    book = null,
    closeLabel,
    readDateLabel,
    readTimeLabel,
    yearLabel,
    authorLabel,
    summaryLabel,
    briefCommentLabel,
    reviewArticleLabel,
    ratingRecommended,
    ratingNeutral,
    ratingNotRecommended,
    noReviewLabel,
    readReviewLabel,
    onclose,
  }: Props = $props();

  let showLightbox = $state(false);

  const ratingLabelMap: Record<BookRating, string> = {
    recommended: ratingRecommended,
    neutral: ratingNeutral,
    "not-recommended": ratingNotRecommended,
  };

  const ratingColor: Record<string, string> = {
    recommended: "bg-emerald-500/80",
    neutral: "bg-amber-400/80",
    "not-recommended": "bg-rose-400/80",
  };

  function closeModal() {
    document.body.style.overflow = "";
    onclose();
  }

  function openLightbox() {
    showLightbox = true;
  }

  function closeLightbox() {
    showLightbox = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (showLightbox) {
        closeLightbox();
      } else {
        closeModal();
      }
    }
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) closeModal();
  }

  $effect(() => {
    if (book) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKeydown);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKeydown);
      };
    }
  });
</script>

{#if book}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label={book.title}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onclick={onBackdropClick}
    ></div>

    <div class="relative bg-[var(--bg-color)] rounded-2xl border border-[var(--button-border-color)] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
      <button
        class="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--button-hover-color)] hover:bg-[var(--button-border-color)] transition-colors"
        onclick={closeModal}
        aria-label={closeLabel}
      >
        <Icon icon="fa6-solid:xmark" class="w-4 h-4" />
      </button>

      <div class="p-6 md:p-8 space-y-5">
        <div class="flex flex-col sm:flex-row gap-5">
          <button
            type="button"
            class="w-28 h-40 shrink-0 rounded-lg overflow-hidden border border-[var(--button-border-color)] bg-[var(--button-hover-color)] flex items-center justify-center cursor-zoom-in hover:ring-2 hover:ring-[var(--link-color)] transition-all"
            onclick={openLightbox}
            aria-label="放大图片"
          >
            {#if book.cover}
              <img src={book.cover} alt={book.title} class="w-full h-full object-cover" />
            {:else}
              <Icon icon="fa6-solid:book" class="w-8 h-8 text-[var(--text-color-70)]" />
            {/if}
          </button>

          <div class="flex-1 min-w-0 space-y-2.5">
            <h2 class="text-xl font-bold text-[var(--text-color)] leading-snug pr-8">{book.title}</h2>
            <p class="text-sm text-[var(--text-color-70)]">
              <span class="font-medium text-[var(--text-color)]">{authorLabel}:</span> {book.author}
            </p>

            <div class="flex flex-wrap gap-1.5">
              {#each book.tags as tag}
                <span class="text-xs px-2 py-0.5 rounded-full bg-[var(--button-hover-color)] text-[var(--text-color-70)] border border-[var(--button-border-color)]">
                  {tag}
                </span>
              {/each}
            </div>

            <span class="inline-block text-xs px-2.5 py-1 rounded-full text-white {ratingColor[book.rating] ?? 'bg-gray-400'}">
              {ratingLabelMap[book.rating] ?? book.rating}
            </span>

            <div class="grid grid-cols-2 gap-2 text-sm text-[var(--text-color-70)] pt-1">
              {#if book.readDate}
                <div>
                  <span class="font-medium text-[var(--text-color)]">{readDateLabel}:</span>
                  {" "}{new Date(book.readDate).toLocaleDateString("zh-CN")}
                </div>
              {/if}
              {#if book.readTimeHours != null}
                <div>
                  <span class="font-medium text-[var(--text-color)]">{readTimeLabel}:</span>
                  {" "}{book.readTimeHours} 小时
                </div>
              {/if}
              {#if book.year}
                <div>
                  <span class="font-medium text-[var(--text-color)]">{yearLabel}:</span>
                  {" "}{book.year}
                </div>
              {/if}
            </div>
          </div>
        </div>

        {#if book.summary}
          <div>
            <h3 class="text-sm font-semibold text-[var(--text-color)] mb-2">{summaryLabel}</h3>
            <p class="text-sm text-[var(--text-color-70)] leading-relaxed">{book.summary}</p>
          </div>
        {/if}

        {#if book.briefComment}
          <div>
            <h3 class="text-sm font-semibold text-[var(--text-color)] mb-2">{briefCommentLabel}</h3>
            <p class="text-sm text-[var(--text-color-70)] leading-relaxed italic">「{book.briefComment}」</p>
          </div>
        {/if}

        <div>
          <h3 class="text-sm font-semibold text-[var(--text-color)] mb-2">{reviewArticleLabel}</h3>
          {#if book.reviewLinks && book.reviewLinks.length > 0}
            <ul class="space-y-2">
              {#each book.reviewLinks as link}
                <li>
                  <a
                    href={link.url}
                    class="text-sm text-[var(--link-color)] hover:underline hover:pl-1 flex items-center gap-2 group transition-all duration-200"
                  >
                    <Icon icon="fa6-solid:file-lines" class="w-3.5 h-3.5 text-[var(--text-color-70)] group-hover:text-[var(--link-color)] transition-colors" />
                    <span>{link.title}</span>
                    <span class="text-xs text-[var(--text-color-70)]">
                      {new Date(link.pubDate).toLocaleDateString("zh-CN")}
                    </span>
                    <Icon icon="fa6-solid:arrow-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-sm text-[var(--text-color-70)] leading-relaxed italic">
              {noReviewLabel}
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Lightbox 放大图 -->
  {#if showLightbox && book.cover}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="fixed inset-0 z-[300] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md cursor-zoom-out"
      onclick={closeLightbox}
      role="dialog"
      aria-modal="true"
    >
      <img
        src={book.cover}
        alt={book.title}
        class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
      />
      <button
        class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onclick={closeLightbox}
        aria-label="关闭"
      >
        <Icon icon="fa6-solid:xmark" class="w-5 h-5" />
      </button>
    </div>
  {/if}
{/if}
