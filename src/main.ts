/**
 * PDF Preview Plugin for Phials
 * 
 * Provides preview and thumbnail support for PDF files using pdf.js.
 * This is a reference implementation demonstrating how to create
 * external Svelte-based plugins for Phials.
 */

import { setPluginAPI } from './pdf-utils';
import PDFPreview from './PDFPreview.svelte';
import PDFThumbnail from './PDFThumbnail.svelte';
import PDFToolbar from './PDFToolbar.svelte';
import { PDFPreviewSession } from './PDFPreviewSession.svelte';

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
  surface: PDFPreview,
  createSession: () => new PDFPreviewSession(),
  toolbar: PDFToolbar,
  destinations: { pageTab: true, embed: true },
  thumbnail: PDFThumbnail,
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
    setPluginAPI(api);
    console.log('[PDF Plugin] Activated');
  },
  
  onDeactivate() {
    setPluginAPI(null);
    console.log('[PDF Plugin] Deactivated');
  },
  
  providers: [pdfPreviewProvider],
};

export default plugin;
