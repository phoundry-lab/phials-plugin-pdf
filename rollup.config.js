import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default {
  input: 'src/main.ts',
  output: {
    file: 'main.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        // Generate client-side code
        generate: 'client',
      },
      emitCss: false, // Inline CSS
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['svelte'],
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    terser({
      format: {
        comments: false,
      },
    }),
  ],
  // Don't bundle these - they're provided by the host app
  external: [],
};

