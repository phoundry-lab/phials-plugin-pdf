/**
 * Phials Plugin Type Definitions
 * 
 * These types are provided by the Phials host application.
 * External plugins receive these types at runtime.
 */

/** File entry from the file browser */
declare global {
  interface FileEntry {
    name: string;
    path: string;
    is_file: boolean;
    is_dir: boolean;
    size?: number;
    modified?: string;
    mimeType?: string;
    category?: FileCategory;
  }

  /** File category */
  type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';

  /** Base plugin API */
  interface PluginAPI {
    settings: PluginSettings;
    appSettings: ReadonlyAppSettings;
    invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
    modal: ModalAPI;
    notify: NotifyAPI;
    files: FileUtilsAPI;
  }

  interface PluginSettings {
    get<T>(key: string): T | undefined;
    set(key: string, value: unknown): Promise<void>;
    getAll(): Record<string, unknown>;
  }

  interface ReadonlyAppSettings {
    readonly videoAutoplay: boolean;
    readonly videoLoop: boolean;
    readonly thumbnailsEnabled: boolean;
    readonly thumbnailSize: number;
    readonly thumbnailQuality: number;
    readonly showHiddenFiles: boolean;
    readonly showParentDirectory: boolean;
  }

  interface ModalAPI {
    confirm(opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }): Promise<boolean>;
    prompt(opts: { title: string; message: string; defaultValue?: string; placeholder?: string }): Promise<string | null>;
    alert(opts: { title: string; message: string }): Promise<void>;
  }

  interface NotifyAPI {
    info(message: string): void;
    success(message: string): void;
    warning(message: string): void;
    error(message: string): void;
  }

  interface FileUtilsAPI {
    getExtension(filename: string): string;
    getBasename(path: string): string;
    getDirname(path: string): string;
    joinPath(...parts: string[]): string;
  }

  /** Plugin container */
  interface PhialsPlugin {
    id: string;
    name: string;
    version: string;
    icons?: string[];
    settings?: PluginSettingsSchema;
    onActivate?: (api: PluginAPI) => void | Promise<void>;
    onDeactivate?: () => void | Promise<void>;
    providers: PluginProvider[];
  }

  /** Plugin provider types */
  type PluginProvider = PreviewProvider;

  /** Preview provider */
  interface PreviewProvider {
    type: 'preview';
    id: string;
    name: string;
    priority?: number;
    extensions?: string[];
    mimeTypes?: string[];
    categories?: FileCategory[];
    canHandle?: (file: FileEntry) => boolean;
    surface?: any; // Responsive preview surface
    preview?: any; // Svelte component
    thumbnail?: any; // Svelte component
    fullscreen?: any; // Component
    overridesDoubleClick?: boolean;
  }

  /** Settings schema */
  interface PluginSettingsSchema {
    title: string;
    fields: SettingsField[];
  }

  type SettingsField =
    | { type: 'boolean'; key: string; label: string; default: boolean; description?: string }
    | { type: 'string'; key: string; label: string; default: string; description?: string }
    | { type: 'number'; key: string; label: string; default: number; min?: number; max?: number; description?: string }
    | { type: 'select'; key: string; label: string; options: { value: string; label: string }[]; default: string; description?: string };
}

export {};
