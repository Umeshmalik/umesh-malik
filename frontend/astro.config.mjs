// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://umesh-malik.com",
  output: "static",
  compressHTML: true,
  integrations: [
    react(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      customPages: [
        "https://umesh-malik.com/",
        "https://umesh-malik.com/about/",
        "https://umesh-malik.com/experience/",
        "https://umesh-malik.com/projects/",
        "https://umesh-malik.com/skills/",
        "https://umesh-malik.com/contact/",
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Enable CSS code splitting for better caching
      cssCodeSplit: true,
    },
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "viewport",
  },
  build: {
    // Inline small stylesheets for faster FCP
    inlineStylesheets: "auto",
  },
});
