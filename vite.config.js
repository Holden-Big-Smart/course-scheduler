import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 关键：Electron 环境必须使用相对路径，否则打包后找不到资源会导致白屏
  base: './', 
  resolve: {
    alias: {
      // 设置 @ 指向 src 目录，方便引入文件
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 固定端口，确保 Electron 能找到它
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})