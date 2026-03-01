// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  modules: [
    '@pinia/nuxt',
  ],
  runtimeConfig: {
    // 服务端私有配置
    openclawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN || '',
    // 客户端公开配置
    public: {
      openclawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789',
      openclawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN || '',
    },
  },
  vite: {
    server: {
      host: '0.0.0.0',
      port: 3000,
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
  },
  ignore: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/node_modules/**',
    '**/.git/**',
    '**/.nuxt/**',
    '**/dist/**',
  ],
  experimental: {
    watcher: 'chokidar-granular',
  },
})
