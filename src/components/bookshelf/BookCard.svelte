<script lang="ts">
  import type { BookMeta } from "@/types/book";
  import Icon from "@iconify/svelte";

  interface Props {
    book: BookMeta;
    onselect: (book: BookMeta) => void;
  }

  let { book, onselect }: Props = $props();
</script>

<button
  class="block w-full text-left border border-[var(--button-border-color)] bg-[var(--bg-color)] overflow-hidden shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[var(--link-color)] focus:outline-none focus:ring-2 focus:ring-[var(--link-color)] group"
  onclick={() => onselect(book)}
  data-aos="fade-up"
  title={book.title + " — " + book.author}
>
  <div class="bg-[var(--button-hover-color)] flex items-center justify-center">
    {#if book.cover}
      <img src={book.cover} alt={book.title} class="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
    {:else}
      <div class="aspect-[3/4] flex items-center justify-center">
        <Icon icon="fa6-solid:book" class="w-12 h-12 text-[var(--text-color-70)]" />
      </div>
    {/if}
  </div>

  <div class="px-3 py-3 space-y-0.5">
    <h3 class="font-semibold text-sm text-[var(--text-color)] truncate leading-snug group-hover:text-[var(--link-color)] transition-colors">{book.title}</h3>
    <p class="text-xs text-[var(--text-color-70)] truncate">{book.author}</p>
  </div>
</button>
