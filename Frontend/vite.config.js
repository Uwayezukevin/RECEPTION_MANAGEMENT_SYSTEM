// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Remove the manualChunks object and use a function or remove it entirely
    rollupOptions: {
      output: {
        // Option 1: Remove manualChunks completely (recommended for simplicity)
        // Or Option 2: Use a function
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('react-icons')) {
              return 'icons';
            }
            if (id.includes('axios') || id.includes('react-hot-toast') || id.includes('socket.io-client')) {
              return 'utils';
            }
          }
        }
      }
    }
  }
})