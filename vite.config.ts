import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Set base path if deploying to a subdirectory
  // Remove or change this if deploying to root
  base: './',
  build: {
    // Ensure proper asset handling for SPA
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:7007',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
