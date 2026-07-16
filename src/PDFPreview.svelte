<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { PDFDocumentProxy } from 'pdfjs-dist';
  import { loadPDF, renderPageToCanvas } from './pdf-utils';
  import { PDFPreviewSession } from './PDFPreviewSession.svelte';

  interface Props {
    file: FileEntry;
    session?: PreviewSession;
  }

  let { file, session }: Props = $props();
  const fallbackSession = new PDFPreviewSession();
  const preview = $derived(
    (session as PDFPreviewSession | undefined) ?? fallbackSession
  );

  let canvas: HTMLCanvasElement;
  let pdf: PDFDocumentProxy | null = null;
  let currentPage = $state(1);
  let totalPages = $state(0);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  async function loadDocument(path: string) {
    isLoading = true;
    error = null;
    currentPage = 1;
    syncSession();
    
    try {
      if (pdf) {
        pdf.destroy();
      }
      pdf = await loadPDF(path);
      totalPages = pdf.numPages;
      syncSession();
      await renderCurrentPage();
    } catch (e) {
      error = 'Failed to load PDF';
      syncSession();
      console.error('PDF load error:', e);
    } finally {
      isLoading = false;
      syncSession();
    }
  }

  async function renderCurrentPage() {
    if (!pdf || !canvas) return;
    await renderPageToCanvas(pdf, currentPage, canvas, 800, 1000);
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      syncSession();
      renderCurrentPage();
    }
  }

  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      syncSession();
      renderCurrentPage();
    }
  }

  onMount(() => {
    const unbind = preview.bindControls(prevPage, nextPage);
    loadDocument(file.path);
    return unbind;
  });

  onDestroy(() => {
    pdf?.destroy();
  });

  function syncSession() {
    preview.currentPage = currentPage;
    preview.totalPages = totalPages;
    preview.isLoading = isLoading;
    preview.error = error;
  }
</script>

<div class="pdf-preview">
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

