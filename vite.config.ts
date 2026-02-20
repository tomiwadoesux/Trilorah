import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import electron from "vite-plugin-electron/simple";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: "electron/main.ts",
        vite: {
          build: {
            rollupOptions: {
              // Keep native modules external - don't bundle them
              external: [
                "better-sqlite3",
                "ws",
                "bufferutil",
                "utf-8-validate",
                "@deepgram/sdk",
                "dotenv",
                "ffmpeg-static",
                "fluent-ffmpeg",
              ],
            },
          },
        },
        onstart(args) {
          // Custom onstart to prevent auto-launching Electron
          // This allows us to use the 'dev:backend' script to launch it manually
          // console.log("Building Electron main process; manual launch expected.");
        },
      },
      preload: {
        input: "electron/preload.ts",
      },
      renderer: {},
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        output: resolve(__dirname, "output.html"),
      },
    },
  },
});
