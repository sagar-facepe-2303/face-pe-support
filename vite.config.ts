import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'
  const proxyTarget = env.VITE_PROXY_TARGET?.trim()

  if (isDev && !proxyTarget) {
    throw new Error(
      'Missing VITE_PROXY_TARGET for development mode. Add it to .env.development.',
    )
  }

  return {
    plugins: [react()],
    server: {
      port: 3001,
      strictPort: true,
      ...(isDev
        ? {
            proxy: {
              '/sp': {
                target: proxyTarget,
                changeOrigin: true,
                secure: true,
              },
            },
          }
        : {}),
    },
  }
})
