export default defineNuxtConfig({
    compatibilityDate: '2026-06-01',
    devtools: { enabled: false },
    typescript: { tsConfig: { compilerOptions: { allowImportingTsExtensions: true } } },
    css: ['~/assets/css/base.css', '~/assets/css/memory.css', '~/assets/css/nuxt.css'],
    app: {
        baseURL: process.env.NUXT_APP_BASE_URL || '/',
        head: {
            htmlAttrs: { lang: 'zh-Hant' },
            title: '去趣旅行提案 · 手機互動版',
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
                { name: 'theme-color', content: '#ffffff' },
                { name: 'description', content: '去趣旅行提案：行程、旅伴 eSIM 優惠與旅行回憶的手機體驗。' }
            ],
            link: [{ rel: 'icon', href: 'data:,' }]
        }
    },
    nitro: {
        prerender: { routes: ['/trips', '/trip', '/esim', '/memory', '/memory/usj', '/planner', '/atlas', '/town', '/wardrobe', '/collection'] },
        // 跟 app 一樣允許 import 寫 .ts：測試用 node --test 直接載入 server/utils，Node 需要完整副檔名
        typescript: { tsConfig: { compilerOptions: { allowImportingTsExtensions: true } } }
    }
});
