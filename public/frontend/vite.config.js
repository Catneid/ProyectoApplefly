import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // La tienda habla con public/backend (4001).
      // El panel de administración es el que usa el 4000.
      '/api': { target: 'http://localhost:4001', changeOrigin: true },
    },
  },
})
