import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project Pages live at moranteam.github.io/effl/
// Local dev uses root path for simpler URLs.
const base = process.env.EFFL_BASE || (process.env.NODE_ENV === "production" ? "/effl/" : "/");

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false
  }
});
