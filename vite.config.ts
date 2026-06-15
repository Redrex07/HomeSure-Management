import { defineConfig } from "@tanstack/react-start/config";
import { nitro } from "nitro/vite";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  vite: {
    plugins: [
      nitro({
        preset: "vercel",
      }),
    ],
  },
});