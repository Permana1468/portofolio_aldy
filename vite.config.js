import { defineConfig } from 'vite';
import { resolve } from 'path';

function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const pathname = urlObj.pathname;
          const routeName = pathname.replace('/api/', '').split('?')[0];

          const routeMap = {
            auth: './api/auth.js',
            berita: './api/berita.js',
            content: './api/content.js',
            upload: './api/upload.js',
          };

          if (!routeMap[routeName]) {
            return next();
          }

          // Parse query string
          const query = {};
          urlObj.searchParams.forEach((val, key) => { query[key] = val; });
          req.query = query;

          // Parse body for POST/PUT requests
          if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.headers['content-type'] || '';
            if (routeName === 'upload') {
              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              req.body = Buffer.concat(chunks);
            } else if (contentType.includes('application/json')) {
              let bodyStr = '';
              for await (const chunk of req) {
                bodyStr += chunk;
              }
              try {
                req.body = bodyStr ? JSON.parse(bodyStr) : {};
              } catch {
                req.body = {};
              }
            }
          }

          // Polyfill res.status and res.json for Vercel Serverless Function compatibility
          res.status = function (code) {
            res.statusCode = code;
            return res;
          };
          res.json = function (data) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };

          // Load handler module dynamically via Vite SSR
          const module = await server.ssrLoadModule(routeMap[routeName]);
          const handler = module.default;
          await handler(req, res);
        } catch (err) {
          console.error('API Dev Middleware Error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [apiDevMiddleware()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        login: resolve(__dirname, 'login.html'),
        berita: resolve(__dirname, 'berita.html'),
      },
    },
  },
});

