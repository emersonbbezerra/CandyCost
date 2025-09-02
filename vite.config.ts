import path from 'path';
import { defineConfig } from 'vite';

// Plugins condicionais
const plugins = [];

// Tentar adicionar plugins se estiverem disponíveis
try {
  const react = require('@vitejs/plugin-react').default;
  plugins.push(react());
} catch (e) {
  console.warn('Plugin React não encontrado, usando esbuild para JSX');
}

try {
  const tailwindcss = require('@tailwindcss/vite').default;
  plugins.push(tailwindcss());
} catch (e) {
  console.warn('Plugin Tailwind não encontrado, usando PostCSS');
}

export default defineConfig({
  plugins,
  esbuild: {
    jsx: 'automatic', // Fallback caso o plugin React não esteja disponível
  },
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'public'),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(
              'Received Response from the Target:',
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
});
