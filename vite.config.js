import { defineConfig } from 'vite';
import fs from 'fs';

function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

function adaptRes(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [
    {
      name: 'copy-js-folder',
      closeBundle() {
        if (fs.existsSync('js')) {
          fs.cpSync('js', 'dist/js', { recursive: true });
        }
      }
    },
    {
      name: 'local-dev-apis',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const parsedUrl = new URL(req.url || '/', 'http://localhost:3000');
          const pathname = parsedUrl.pathname;

          if (!pathname.startsWith('/api/')) {
            return next();
          }

          adaptRes(res);
          req.query = Object.fromEntries(parsedUrl.searchParams.entries());

          if (req.method === 'POST') {
            req.body = await readJsonBody(req);
          }

          // Điều phối các route API chuẩn Vercel Serverless (Dynamic import chống cache khi dev)
          try {
            if (pathname === '/api/ip') {
              const mod = await import(`./api/ip.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/auth/verify') {
              const mod = await import(`./api/auth/verify.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/auth/refresh') {
              const mod = await import(`./api/auth/refresh.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/auth/logout') {
              const mod = await import(`./api/auth/logout.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/quests/enroll') {
              const mod = await import(`./api/quests/enroll.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/quests/progress') {
              const mod = await import(`./api/quests/progress.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/quests/lookup') {
              const mod = await import(`./api/quests/lookup.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/quests/reward-code') {
              const mod = await import(`./api/quests/reward-code.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
            if (pathname === '/api/quests') {
              const mod = await import(`./api/quests/index.js?t=${Date.now()}`);
              return mod.default(req, res);
            }
          } catch (apiErr) {
            console.error('[Dev API Error]:', apiErr);
            return res.status(500).json({ success: false, error: apiErr.message });
          }

          next();
        });
      }
    }
  ]
});
