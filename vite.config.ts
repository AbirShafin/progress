import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    ...tanstackStart({
      server: { entry: "server" },
      prerender: { enabled: true },
    }),
    react(),
  ],
});
