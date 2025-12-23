# PDF Preview Plugin for Phials

A reference implementation demonstrating how to create external plugins for [Phials](https://github.com/phials-dev/phials).

## Features

- Preview PDF files with page navigation
- Generate thumbnails for PDF files in the file browser
- Uses [pdf.js](https://mozilla.github.io/pdf.js/) for rendering

## Installation

### From Community Registry

1. Open Phials
2. Go to **Settings** → **Plugins**
3. Switch to the **Community** tab
4. Search for "PDF Preview"
5. Click **Install**
6. Click **Enable** and approve the permission request

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/phials-dev/phials-plugin-pdf/releases)
2. Extract the files to `~/.phials/plugins/phials.pdf/`
3. Restart Phials
4. Enable the plugin in Settings

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/phials-dev/phials-plugin-pdf.git
cd phials-plugin-pdf

# Install dependencies
npm install

# Build the plugin
npm run build

# Or watch for changes during development
npm run dev
```

### Project Structure

```
phials-plugin-pdf/
├── src/
│   ├── main.ts           # Plugin entry point
│   ├── PDFPreview.svelte # Preview component
│   ├── PDFThumbnail.svelte # Thumbnail component
│   ├── pdf-utils.ts      # Shared PDF utilities
│   └── types.d.ts        # Type definitions
├── manifest.json         # Plugin metadata
├── package.json
├── rollup.config.js      # Build configuration
└── tsconfig.json
```

### Building

The plugin is built using Rollup, which bundles all dependencies into a single `main.js` file:

```bash
npm run build
```

This produces:
- `main.js` - The bundled plugin code
- `main.js.map` - Source map for debugging

### Testing Locally

1. Build the plugin: `npm run build`
2. Copy files to Phials plugins directory:
   ```bash
   mkdir -p ~/.phials/plugins/phials.pdf
   cp manifest.json main.js ~/.phials/plugins/phials.pdf/
   ```
3. Restart Phials or reload plugins

## Creating Your Own Plugin

This repository serves as a template for creating Phials plugins. Key concepts:

### 1. Plugin Structure

Every plugin needs:
- `manifest.json` - Metadata and permissions
- `main.js` - Bundled ES module with a default export

### 2. Plugin API

External plugins receive a `PluginAPI` object in `onActivate`:

```typescript
const plugin: PhialsPlugin = {
  id: 'your.plugin',
  name: 'Your Plugin',
  version: '1.0.0',
  
  onActivate(api: PluginAPI) {
    // api.invoke() - Call Tauri commands
    // api.settings - Access plugin settings
    // api.modal - Show dialogs
    // api.notify - Show notifications
    // api.files - File path utilities
  },
  
  providers: [/* ... */],
};

export default plugin;
```

### 3. Providers

Plugins contribute functionality through providers:

- **PreviewProvider** - Render file previews and thumbnails
- **ContextProvider** - Add context menu items
- **MetadataProvider** - Extract file metadata
- **ThemeProvider** - Add color themes

### 4. Permissions

Request only the permissions you need in `manifest.json`:

| Permission | Use Case |
|------------|----------|
| `filesystem.read` | Read file contents |
| `filesystem.write` | Create/modify files |
| `clipboard.read` | Read clipboard |
| `clipboard.write` | Copy to clipboard |
| `network.fetch` | Make HTTP requests |
| `shell.execute` | Run shell commands |

### 5. Components

External plugins can use **Svelte components** (recommended) or vanilla JS components.

#### Option A: Svelte Components (Recommended)

Plugins can bundle their own Svelte runtime:

```typescript
// src/MyPreview.svelte
<script lang="ts">
  interface Props { file: FileEntry; }
  let { file }: Props = $props();
</script>

<div class="preview">{file.name}</div>

// src/main.ts
import MyPreview from './MyPreview.svelte';

const provider: PreviewProvider = {
  type: 'preview',
  id: 'my.preview',
  name: 'My Preview',
  extensions: ['xyz'],
  preview: MyPreview,
};
```

#### Option B: Vanilla JS Components

For plugins that don't want to bundle Svelte:

```typescript
function createComponent() {
  return {
    create(target: HTMLElement, props: any) {
      const el = document.createElement('div');
      target.appendChild(el);
      
      return {
        destroy() { el.remove(); },
        update(newProps: any) { /* ... */ },
      };
    },
  };
}
```

## Releasing

1. Update version in `package.json` and `manifest.json`
2. Build the plugin: `npm run build`
3. Create a GitHub Release with:
   - `manifest.json`
   - `main.js`
4. Tag the release (e.g., `v1.0.1`)

## License

MIT
