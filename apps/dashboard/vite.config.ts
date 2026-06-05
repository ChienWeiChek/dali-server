import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_VERSION': JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
