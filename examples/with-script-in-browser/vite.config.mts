import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3001,
    // open the browser
    open: true,
  },
  publicDir: "public",
  optimizeDeps: {
    esbuildOptions: {
      // Bumping to 2022 due to "Arbitrary module namespace identifier names" not being
      // supported in Vite's default browser target https://github.com/vitejs/vite/issues/13556
      target: "es2022",
      treeShaking: true,
    },
  },
  resolve: {
    alias: [
      { find: "@excalidraw/common", replacement: fileURLToPath(new URL("../../packages/common/src", import.meta.url)) },
      { find: "@excalidraw/element", replacement: fileURLToPath(new URL("../../packages/element/src", import.meta.url)) },
      { find: "@excalidraw/math", replacement: fileURLToPath(new URL("../../packages/math/src", import.meta.url)) },
      { find: "@excalidraw/utils", replacement: fileURLToPath(new URL("../../packages/utils/src", import.meta.url)) },
      // packages/excalidraw doesn't have a top-level `src` directory; point to package root
      { find: "@excalidraw/excalidraw", replacement: fileURLToPath(new URL("../../packages/excalidraw", import.meta.url)) },
    ],
  },
});
