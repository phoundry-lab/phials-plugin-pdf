<script lang="ts">
  import type { PDFPreviewSession } from './PDFPreviewSession.svelte';

  let { session }: PreviewToolbarContributionProps = $props();
  const pdf = $derived(session as PDFPreviewSession | undefined);
</script>

{#if pdf}
  <button onclick={pdf.previousPage} disabled={pdf.currentPage <= 1 || pdf.isLoading} title="Previous page">←</button>
  <span>{pdf.error ?? (pdf.isLoading ? 'Loading…' : `${pdf.currentPage} / ${pdf.totalPages}`)}</span>
  <button onclick={pdf.nextPage} disabled={pdf.currentPage >= pdf.totalPages || pdf.isLoading} title="Next page">→</button>
{/if}

<style>
  button {
    padding: 4px 12px;
    background: var(--surface-overlay, #404040);
    border: none;
    border-radius: 4px;
    color: var(--text-primary, #e5e5e5);
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  span {
    min-width: 5.5rem;
    text-align: center;
  }
</style>
