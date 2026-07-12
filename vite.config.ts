import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
 plugins: [
  TanStackRouterVite(),

  tanstackStart({
    server: {
      entry: "server",
    },
  }),

  react(),

  tailwindcss(),

  nitro({
    preset: "vercel",
  }),
],
});