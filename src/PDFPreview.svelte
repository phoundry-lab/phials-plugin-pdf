<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { PDFDocumentProxy } from 'pdfjs-dist';
  import { loadPDF, renderPageToCanvas } from './pdf-utils';

  interface Props {
    file: FileEntry;
  }

  let { file }: Props = $props();

  let canvas: HTMLCanvasElement;
  let pdf: PDFDocumentProxy | null = null;
  let currentPage = $state(1);
  let totalPages = $state(0);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  const pageInfo = $derived(
    isLoading ? 'Loading...' : error ? error : `Page ${currentPage} of ${totalPages}`
  );

  async function loadDocument(path: string) {
    isLoading = true;
    error = null;
    currentPage = 1;
    
    try {
      if (pdf) {
        pdf.destroy();
      }
      pdf = await loadPDF(path);
      totalPages = pdf.numPages;
      await renderCurrentPage();
    } catch (e) {
      error = 'Failed to load PDF';
      console.error('PDF load error:', e);
    } finally {
      isLoading = false;
    }
  }

  async function renderCurrentPage() {
    if (!pdf || !canvas) return;
    await renderPageToCanvas(pdf, currentPage, canvas, 800, 1000);
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  }

  onMount(() => {
    loadDocument(file.path);
  });

  onDestroy(() => {
    pdf?.destroy();
  });
</script>

<div class="pdf-preview">
  <div class="header">
    <button onclick={prevPage} disabled={currentPage <= 1 || isLoading}>←</button>
    <span>{pageInfo}</span>
    <button onclick={nextPage} disabled={currentPage >= totalPages || isLoading}>→</button>
  </div>
  
  <div class="canvas-container">
    <canvas bind:this={canvas}></canvas>
  </div>
</div>

<style>
  .pdf-preview {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--surface-sunken, #0a0a0a);
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 8px;
    background: var(--surface-raised, #262626);
    border-bottom: 1px solid var(--border-muted, #333);
    font-size: 13px;
    color: var(--text-secondary, #a3a3a3);
  }

  .header button {
    padding: 4px 12px;
    background: var(--surface-overlay, #404040);
    border: none;
    border-radius: 4px;
    color: var(--text-primary, #e5e5e5);
    cursor: pointer;
  }

  .header button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .header button:hover:not(:disabled) {
    background: var(--surface-raised, #525252);
  }

  .canvas-container {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 16px;
  }

  canvas {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    max-width: 100%;
  }
</style>

