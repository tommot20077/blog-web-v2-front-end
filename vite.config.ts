import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5500,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@codemirror/')) {
            return 'vendor-codemirror'
          }
          if (id.includes('/node_modules/@lezer/')) {
            return 'vendor-lezer'
          }
        },
      },
    },
  },
})
