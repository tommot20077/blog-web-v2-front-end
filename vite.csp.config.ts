import { defineConfig, mergeConfig } from 'vite'
import viteConfig from './vite.config'
import { readNginxCsp } from './e2e/csp/nginxCsp'

/**
 * CSP E2E 專用的 Vite 設定（A2 / XSS-03）。
 *
 * 為什麼不用既有 mock E2E 的 `vite dev`：dev server 會注入 inline 的 HMR client、以未打包的 ESM 供應，
 * 與正式環境（nginx 供應 vite build 產物）的 script / style 載入方式不同，在 dev server 上量到的 CSP 違規沒有代表性。
 * 所以這裡改用「mock 模式的正式建置（`vite build --mode mock`，輸出到 dist-csp）＋ `vite preview`」，
 * 頁面內容與正式產物同形，並由 preview.headers 對每個回應送出 nginx.conf 實際使用的 CSP header。
 *
 * CSP 字串與 header 名稱（強制 / Report-Only）每次啟動時從 nginx.conf 解析，沒有第二份複本。
 */
const { headerName, policy } = readNginxCsp()

export default mergeConfig(
  viteConfig,
  defineConfig({
    build: { outDir: 'dist-csp', emptyOutDir: true },
    preview: {
      host: 'localhost',
      port: 5500,
      strictPort: true,
      headers: { [headerName]: policy },
    },
  }),
)
