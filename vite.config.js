import { defineConfig } from 'vite';
import ipHandler from './api/ip.js';
import verifyHandler from './api/auth/verify.js';
import refreshHandler from './api/auth/refresh.js';
import logoutHandler from './api/auth/logout.js';
import questsHandler from './api/quests/index.js';
import enrollHandler from './api/quests/enroll.js';
import progressHandler from './api/quests/progress.js';

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

import fs from 'fs';

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

          // Điều phối các route API chuẩn Vercel Serverless
          if (pathname === '/api/ip') {
            return ipHandler(req, res);
          }
          if (pathname === '/api/auth/verify') {
            return verifyHandler(req, res);
          }
          if (pathname === '/api/auth/refresh') {
            return refreshHandler(req, res);
          }
          if (pathname === '/api/auth/logout') {
            return logoutHandler(req, res);
          }
          if (pathname === '/api/quests/enroll') {
            return enrollHandler(req, res);
          }
          if (pathname === '/api/quests/progress') {
            return progressHandler(req, res);
          }
          if (pathname === '/api/quests') {
            return questsHandler(req, res);
          }

          next();
        });
      }
    }
  ]
});
