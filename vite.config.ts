import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { codeInspectorPlugin } from 'code-inspector-plugin';

// Get proxy target from env vars, default to SiliconFlow
const getProxyTarget = () => {
  const customUrl = process.env.VITE_AI_API_URL;
  if (customUrl) {
    // Extract base URL from full URL
    try {
      const url = new URL(customUrl);
      return url.origin;
    } catch {
      // If parsing fails, use default
    }
  }

  // Select target based on provider
  const provider = process.env.VITE_AI_PROVIDER || 'glm';
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com';
    case 'glm':
      return 'https://open.bigmodel.cn';
    case 'siliconflow':
      return 'https://api.siliconflow.cn';
    default:
      return 'https://open.bigmodel.cn';
  }
};

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';

  return {
    base: '/', // Vercel deployment uses root path
    server: {
      proxy: {
        '/api': {
          target: getProxyTarget(),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('Proxy error:', err);
            });
          },
        },
      },
    },
    plugins: [
      isDev
        ? codeInspectorPlugin({
            bundler: 'vite',
            hotKeys: ['altKey'],
          })
        : undefined,
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
        manifest: {
          name: 'Wasteland Ascendant',
          short_name: 'Wasteland',
          description: 'Post-apocalyptic survival RPG',
          theme_color: '#0a0f0a',
          background_color: '#0a0f0a',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@hooks': path.resolve(__dirname, './hooks'),
        '@services': path.resolve(__dirname, './services'),
        '@utils': path.resolve(__dirname, './utils'),
        '@types': path.resolve(__dirname, './types'),
        '@constants': path.resolve(__dirname, './constants'),
        '@components': path.resolve(__dirname, './components'),
        '@views': path.resolve(__dirname, './views'),
        '@assets': path.resolve(__dirname, './assets'),
        '@styles': path.resolve(__dirname, './styles'),
      },
    },
  };
});
