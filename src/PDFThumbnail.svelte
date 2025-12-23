<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { PDFDocumentProxy } from 'pdfjs-dist';
  import { loadPDF, renderPageToCanvas } from './pdf-utils';

  interface Props {
    file: FileEntry;
    size: number;
  }

  let { file, size = 128 }: Props = $props();

  let canvas: HTMLCanvasElement;
  let pdf: PDFDocumentProxy | null = null;
  let error = $state(false);

  async function loadThumbnail(path: string) {
    error = false;
    
    try {
      if (pdf) {
        pdf.destroy();
      }
      pdf = await loadPDF(path);
      await renderPageToCanvas(pdf, 1, canvas, size, size);
    } catch (e) {
      error = true;
      // Draw placeholder
      if (canvas) {
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PDF', size / 2, size / 2);
      }
    }
  }

  onMount(() => {
    loadThumbnail(file.path);
  });

  onDestroy(() => {
    pdf?.destroy();
  });
</script>

<canvas 
  bind:this={canvas}
  class="pdf-thumbnail"
  class:error
></canvas>

<style>
  .pdf-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: white;
    border-radius: 4px;
  }

  .pdf-thumbnail.error {
    background: #1a1a1a;
  }
</style>

