import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.error('[vite] backend proxy error:', err.message);
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  success: false,
                  code: 'BACKEND_UNREACHABLE',
                  message:
                    'API server is not running on http://localhost:8081. Start the backend with npm run dev in multiprodcutbackend.',
                })
              );
            }
          });
        },
      },
    },
  },
});
