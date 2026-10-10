# 同一次建置出兩個映像（跟 MEDDEMO 一樣是 web＋api）：
#   web：Nginx 放預先產生的頁面與素材，/api、/health 轉給 api
#   api：Nitro（Nuxt 的伺服器）跑 /api、/health，以及沒有預先產生的頁面
#   docker build --target web frontend
#   docker build --target api frontend
FROM node:24.21.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall 的 nuxt prepare 要讀程式碼，這時還沒複製進來；下面的 nuxt build 會自己做一次
RUN npm ci --ignore-scripts
COPY . .
# 不加 --prerender：那是 GitHub Pages 用的純靜態模式，不會產出伺服器。
# nuxt.config.ts 的 nitro.prerender.routes 照樣預先產生成靜態檔
RUN npx nuxt build
# public/ 的素材（約 700 MB）在 web 映像裡自成一層、內容沒變就沿用快取；
# 這裡把建置複製進 .output/public 的那份刪掉，最後一層只剩每次都會變的 _nuxt 與預先產生的頁面
RUN cd .output/public && for f in $(ls -A /app/public); do rm -rf "./$f"; done

FROM node:24.21.0-alpine AS api
WORKDIR /srv
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.output/server ./server
COPY scripts/poi/ ./poi/
COPY public/poi/ ./poi-seed/
USER node
EXPOSE 3000
CMD ["node", "server/index.mjs"]

FROM nginx:1.30.4-alpine AS web
# 映像內建的歡迎頁會蓋掉首頁：首頁沒有預先產生，要交給 Nitro
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/
COPY --from=build /app/.output/public/ /usr/share/nginx/html/
