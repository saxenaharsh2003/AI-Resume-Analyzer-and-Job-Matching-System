import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("recharts")) return "charts";
            if (id.includes("@react-three/fiber") || id.includes("/three/")) return "three";
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("react-router-dom")
            ) {
              return "vendor";
            }
          }
          return undefined;
        },
      },
    },
  },
})
