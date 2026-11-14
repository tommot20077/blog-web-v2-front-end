import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5500,
    proxy: {
      // 供文章內文相對路徑圖片網址（例如 /api/v1/files/{id}/content）在本機開發時解析用。
      // 開發模式的 apiClient.ts 仍以 VITE_API_BASE_URL（.env.development 的絕對網址）直接呼叫後端，不經過這個 proxy。
      // 正式建置前後端同網域，apiClient 用相對路徑；這裡只是讓本機 dev 拓撲對齊正式環境。
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
