import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5500,
    proxy: {
      // 僅供文章內文相對路徑圖片網址（例如 /api/v1/files/{id}/content）在本機開發時解析用。
      // apiClient.ts 仍以 VITE_API_BASE_URL（絕對網址）直接呼叫後端 API，不會經過這個 proxy，本次未變動。
      // 正式環境前後端同域（90030.xyz），相對路徑天然可用；這裡只是讓本機 dev 拓撲對齊正式環境。
      '/api': {
        target: 'http://localhost:9010',
        changeOrigin: true,
      },
    },
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
