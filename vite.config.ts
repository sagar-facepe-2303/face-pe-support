import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sp': {
        target: 'https://supportportal.dev.facepe.ai',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
