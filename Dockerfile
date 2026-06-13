# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build
# Node 22-alpine: 對齊本機 Node v22 並滿足 Vite 7 (>= 20.19 / >= 22.12) 需求。
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# 先複製 lockfile，最大化 Docker layer cache（依賴未變則略過 npm ci）。
COPY package.json package-lock.json ./
RUN npm ci

# 複製其餘原始碼（.dockerignore 已排除 node_modules / dist / 測試產物等）。
COPY . .

# production build：vue-tsc 型別檢查 + vite build。
# Vite 於 `vite build` 自動載入 mode=production 的 .env.production，
# 因此 VITE_API_BASE_URL=https://90030.xyz 會被打進 bundle。
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: runtime
# nginx:alpine 純靜態服務 + SPA history fallback。
# ---------------------------------------------------------------------------
FROM nginx:alpine AS runtime

# 自訂站台設定（SPA fallback / gzip / 快取 / 安全標頭）。
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 僅複製建置產物，runtime image 不含 node_modules / 原始碼。
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx:alpine 內建之 docker-entrypoint 會做模板處理後 exec CMD。
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
