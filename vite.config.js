import { defineConfig, createLogger } from 'vite';
import fs from 'fs';
import { serverLog } from './lib/logger.js';
import ipHandler from './api/ip.js';
import verifyHandler from './api/auth/verify.js';
import refreshHandler from './api/auth/refresh.js';
import logoutHandler from './api/auth/logout.js';
import questsHandler from './api/quests/index.js';
import enrollHandler from './api/quests/enroll.js';
import progressHandler from './api/quests/progress.js';
import lookupHandler from './api/quests/lookup.js';
import rewardCodeHandler from './api/quests/reward-code.js';
import hypesquadHandler from './api/badges/hypesquad.js';
import badgeGamesHandler from './api/badges/games.js';
import badgeScienceHandler from './api/badges/science.js';

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

const customLogger = createLogger();
const origInfo = customLogger.info.bind(customLogger);
customLogger.info = (msg, options) => {
  if (typeof msg === 'string' && (
    msg.includes('ready in') ||
    msg.includes('show help') ||
    msg.includes('hmr update') ||
    msg.includes('page reload')
  )) {
    return;
  }
  origInfo(msg, options);
};

export default defineConfig({
  customLogger,
  clearScreen: false,
  server: {
    port: 3000,
    host: true
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
        server.printUrls = () => {
          const urls = server.resolvedUrls || { local: ['http://localhost:3000/'], network: [] };
          console.log('');
          console.log(`\x1b[32m✔\x1b[0m \x1b[1m[Server]\x1b[0m    Khởi chạy máy chủ thành công`);
          console.log('');
          for (const url of urls.local || []) {
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m    \x1b[36m${url.replace(/\/$/, '')}\x1b[0m`);
          }
          for (const url of urls.network || []) {
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mNetwork:\x1b[0m  \x1b[36m${url.replace(/\/$/, '')}\x1b[0m`);
          }
          console.log('');
        };

        server.middlewares.use(async (req, res, next) => {
          const parsedUrl = new URL(req.url || '/', 'http://localhost:3000');
          const pathname = parsedUrl.pathname;

          if (!pathname.startsWith('/api/')) {
            return next();
          }

          const startTime = Date.now();
          res.on('finish', () => {
            const ms = Date.now() - startTime;
            const status = res.statusCode || 200;
            const level = status >= 500 ? 'error' : (status >= 400 ? 'warn' : 'success');
            serverLog(level, `${req.method} ${pathname} (${status}, ${ms}ms)`);
          });

          adaptRes(res);
          req.query = Object.fromEntries(parsedUrl.searchParams.entries());

          if (req.method === 'POST' || req.method === 'DELETE') {
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
          if (pathname === '/api/quests/lookup') {
            return lookupHandler(req, res);
          }
          if (pathname === '/api/quests/reward-code') {
            return rewardCodeHandler(req, res);
          }
          if (pathname === '/api/quests') {
            return questsHandler(req, res);
          }
          if (pathname === '/api/badges/hypesquad') {
            return hypesquadHandler(req, res);
          }
          if (pathname === '/api/badges/games') {
            return badgeGamesHandler(req, res);
          }
          if (pathname === '/api/badges/science') {
            return badgeScienceHandler(req, res);
          }

          next();
        });
      }
    }
  ]
});
