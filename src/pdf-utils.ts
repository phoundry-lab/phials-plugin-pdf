/**
 * PDF Utilities
 * 
 * Shared utilities for loading and rendering PDFs.
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Configure pdf.js worker - use fake worker to avoid web worker issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// Store API reference for use in components
let pluginAPI: PluginAPI | null = null;

/**
 * Set the plugin API reference
 */
export function setPluginAPI(api: PluginAPI | null) {
  pluginAPI = api;
}

/**
 * Get the plugin API reference
 */
export function getPluginAPI(): PluginAPI | null {
  return pluginAPI;
}

/**
 * Load a PDF document from a file path
 */
export async function loadPDF(path: string): Promise<PDFDocumentProxy> {
  if (!pluginAPI) {
    throw new Error('Plugin API not initialized');
  }
  
  // Read the file as binary using the plugin API
  const data = await pluginAPI.invoke<number[]>('read_binary_file_cmd', { path });
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
export async function renderPageToCanvas(
  pdf: PDFDocumentProxy,
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

