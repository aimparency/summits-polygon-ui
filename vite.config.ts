import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "global": {},
  },  
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@import "./src/global.scss";'
      }
    }
  }
})

