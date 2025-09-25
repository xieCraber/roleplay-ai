import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      // 开发环境代理，避免CORS问题
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
        // 移除 rewrite 配置
      }
    }
  }
})