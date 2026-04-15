import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/agent': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/ollama': {
        target: 'https://proxy.integroup.eu',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/ollama/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            if (env.OLLAMA_CF_CLIENT_ID) proxyReq.setHeader('CF-Access-Client-Id', env.OLLAMA_CF_CLIENT_ID);
            if (env.OLLAMA_CF_CLIENT_SECRET) proxyReq.setHeader('CF-Access-Client-Secret', env.OLLAMA_CF_CLIENT_SECRET);
          });
        },
      },
      '/api/groq': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/groq/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.GROQ_API_KEY) proxyReq.setHeader('Authorization', `Bearer ${env.GROQ_API_KEY}`);
            });
          },
        },
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/claude/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
              if (env.ANTHROPIC_API_KEY) {
                proxyReq.setHeader('x-api-key', env.ANTHROPIC_API_KEY);
                proxyReq.setHeader('anthropic-version', '2023-06-01');
              }
            });
          },
        },
      },
    },
  }
})
