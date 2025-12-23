/**
 * PDF Preview Plugin for Phials
 * 
 * Provides preview and thumbnail support for PDF files using pdf.js.
 * This is a reference implementation demonstrating how to create
 * external plugins for Phials.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure pdf.js worker
// We use the legacy build to avoid web worker issues in the plugin context
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// Store API reference for use in components
let pluginAPI: PluginAPI | null = null;

// ─── PDF Rendering Utilities ──────────────────────────────────────────────────

/**
 * Load a PDF document from a file path
 */
async function loadPDF(path: string): Promise<pdfjsLib.PDFDocumentProxy> {
  // Read the file as binary using the plugin API
  const data = await pluginAPI!.invoke<number[]>('read_binary_file_cmd', { path });
  const uint8Array = new Uint8Array(data);
  
  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    useSystemFonts: true,
  });
  
  return loadingTask.promise;
}

/**
 * Render a PDF page to a canvas
 */
async function renderPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  maxWidth?: number,
  maxHeight?: number
): Promise<void> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  
  // Calculate scale to fit within bounds
  let scale = 1;
  if (maxWidth || maxHeight) {
    const scaleX = maxWidth ? maxWidth / viewport.width : Infinity;
    const scaleY = maxHeight ? maxHeight / viewport.height : Infinity;
    scale = Math.min(scaleX, scaleY, 2); // Cap at 2x for performance
  }
  
  const scaledViewport = page.getViewport({ scale });
  
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  await page.render({
    canvasContext: ctx,
    viewport: scaledViewport,
  }).promise;
}

// ─── Preview Component ────────────────────────────────────────────────────────

/**
 * Creates the PDF preview component
 * This is a vanilla JS component since external plugins can't use Svelte
 */
function createPreviewComponent() {
  return {
    // Component factory
    create(target: HTMLElement, props: { file: FileEntry }) {
      const container = document.createElement('div');
      container.className = 'pdf-preview';
      container.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--surface-sunken, #0a0a0a);
        overflow: hidden;
      `;
      
      // Header with page controls
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 8px;
        background: var(--surface-raised, #262626);
        border-bottom: 1px solid var(--border-muted, #333);
        font-size: 13px;
        color: var(--text-secondary, #a3a3a3);
      `;
      
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '←';
      prevBtn.style.cssText = `
        padding: 4px 12px;
        background: var(--surface-overlay, #404040);
        border: none;
        border-radius: 4px;
        color: var(--text-primary, #e5e5e5);
        cursor: pointer;
      `;
      
      const pageInfo = document.createElement('span');
      pageInfo.textContent = 'Loading...';
      
      const nextBtn = document.createElement('button');
      nextBtn.textContent = '→';
      nextBtn.style.cssText = prevBtn.style.cssText;
      
      header.appendChild(prevBtn);
      header.appendChild(pageInfo);
      header.appendChild(nextBtn);
      
      // Canvas container
      const canvasContainer = document.createElement('div');
      canvasContainer.style.cssText = `
        flex: 1;
        overflow: auto;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 16px;
      `;
      
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        max-width: 100%;
      `;
      canvasContainer.appendChild(canvas);
      
      container.appendChild(header);
      container.appendChild(canvasContainer);
      target.appendChild(container);
      
      // State
      let pdf: pdfjsLib.PDFDocumentProxy | null = null;
      let currentPage = 1;
      let totalPages = 0;
      
      const updatePageInfo = () => {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
      };
      
      const renderCurrentPage = async () => {
        if (!pdf) return;
        await renderPageToCanvas(pdf, currentPage, canvas, 800, 1000);
        updatePageInfo();
      };
      
      prevBtn.onclick = async () => {
        if (currentPage > 1) {
          currentPage--;
          await renderCurrentPage();
        }
      };
      
      nextBtn.onclick = async () => {
        if (currentPage < totalPages) {
          currentPage++;
          await renderCurrentPage();
        }
      };
      
      // Load PDF
      (async () => {
        try {
          pdf = await loadPDF(props.file.path);
          totalPages = pdf.numPages;
          await renderCurrentPage();
        } catch (error) {
          pageInfo.textContent = 'Failed to load PDF';
          console.error('PDF load error:', error);
        }
      })();
      
      return {
        destroy() {
          pdf?.destroy();
          container.remove();
        },
        update(newProps: { file: FileEntry }) {
          if (newProps.file.path !== props.file.path) {
            props = newProps;
            currentPage = 1;
            pdf?.destroy();
            (async () => {
              try {
                pdf = await loadPDF(props.file.path);
                totalPages = pdf.numPages;
                await renderCurrentPage();
              } catch (error) {
                pageInfo.textContent = 'Failed to load PDF';
              }
            })();
          }
        },
      };
    },
  };
}

// ─── Thumbnail Component ──────────────────────────────────────────────────────

/**
 * Creates the PDF thumbnail component
 */
function createThumbnailComponent() {
  return {
    create(target: HTMLElement, props: { file: FileEntry; size: number }) {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: white;
        border-radius: 4px;
      `;
      target.appendChild(canvas);
      
      let pdf: pdfjsLib.PDFDocumentProxy | null = null;
      
      (async () => {
        try {
          pdf = await loadPDF(props.file.path);
          await renderPageToCanvas(pdf, 1, canvas, props.size, props.size);
        } catch (error) {
          // Show placeholder on error
          canvas.width = props.size;
          canvas.height = props.size;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, props.size, props.size);
          ctx.fillStyle = '#666';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PDF', props.size / 2, props.size / 2);
        }
      })();
      
      return {
        destroy() {
          pdf?.destroy();
          canvas.remove();
        },
        update() {},
      };
    },
  };
}

// ─── Plugin Definition ────────────────────────────────────────────────────────

/**
 * PDF Preview Provider
 */
const pdfPreviewProvider: PreviewProvider = {
  type: 'preview',
  id: 'phials.pdf.preview',
  name: 'PDF Preview',
  priority: 100,
  extensions: ['pdf'],
  mimeTypes: ['application/pdf'],
  preview: createPreviewComponent(),
  thumbnail: createThumbnailComponent(),
};

/**
 * Main plugin export
 */
const plugin: PhialsPlugin = {
  id: 'phials.pdf',
  name: 'PDF Preview',
  version: '1.0.0',
  icons: ['mdi:file-pdf-box'],
  
  onActivate(api: PluginAPI) {
    pluginAPI = api;
    console.log('[PDF Plugin] Activated');
  },
  
  onDeactivate() {
    pluginAPI = null;
    console.log('[PDF Plugin] Deactivated');
  },
  
  providers: [pdfPreviewProvider],
};

export default plugin;

