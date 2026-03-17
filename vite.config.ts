import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // GEMINI_API_KEY removed from client bundle — route AI requests through backend
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.test.{ts,tsx}'],
        exclude: ['node_modules', 'bennett-backend', 'backend'],
        setupFiles: ['./test/setup.ts'],
        css: true,
        coverage: {
          provider: 'v8',
          include: ['components/**', 'store/**', 'services/**', 'pages/**', 'hooks/**'],
          exclude: ['**/*.test.{ts,tsx}'],
        },
      },
    };
});
