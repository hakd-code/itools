// Express 应用装配（导出 createApp 供 server 与测试共用）
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDb } from './db.js';
import { generatePasswords, ParamError } from './lib/password.js';
import { rateLimit, resetRateLimits } from './lib/ratelimit.js';
import { ensureSeeded, scheduleFetch } from './lib/rates.js';
import { CURRENCIES } from './lib/currencies.js';
import { homePage } from './views/home.js';
import { passwordPage, exchangePage, uuidPage, md5Page, casePage, diffPage } from './views/tool-pages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp({ dbPath = join(__dirname, '..', 'data', 'itools.db') } = {}) {
  const db = openDb(dbPath);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));
  app.use((req, res, next) => { req.db = db; next(); });

  // 静态资源
  app.use(express.static(join(__dirname, '..', 'public'), { maxAge: '1h' }));

  // 页面路由
  app.get('/', (req, res) => res.send(homePage()));
  app.get('/tools/password/', (req, res) => res.send(passwordPage()));
  app.get('/tools/exchange/', (req, res) => res.send(exchangePage()));
  app.get('/tools/uuid/', (req, res) => res.send(uuidPage()));
  app.get('/tools/md5/', (req, res) => res.send(md5Page()));
  app.get('/tools/case/', (req, res) => res.send(casePage()));
  app.get('/tools/diff/', (req, res) => res.send(diffPage()));

  // API：随机密码（服务端强随机，限流 60 次/分钟/IP）
  app.post('/api/tools/password', rateLimit({ windowMs: 60_000, max: 60 }), (req, res) => {
    try {
      const { passwords } = generatePasswords(req.body ?? {});
      res.json({ passwords });
    } catch (err) {
      if (err instanceof ParamError) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  });

  // API：汇率
  app.get('/api/tools/rates', (req, res) => {
    const base = String(req.query.base ?? 'USD').toUpperCase();
    if (base !== 'USD') return res.status(400).json({ error: '暂仅支持 USD 基准（数据源限制）' });
    const latest = db.getLatestRates();
    if (!latest) return res.status(503).json({ error: '汇率数据尚未就绪，请稍后重试' });
    res.json({
      base,
      rates: latest.rates,
      updatedAt: latest.updatedAt,
      source: latest.source,
      stale: latest.source === 'baseline' || Date.now() - new Date(latest.updatedAt).getTime() > 24 * 3600 * 1000,
    });
  });

  app.get('/api/tools/rates/currencies', (req, res) => {
    res.json({ currencies: CURRENCIES });
  });

  // 404
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: '接口不存在' });
    res.status(404).send(homePage());
  });

  // 错误处理
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[itools] error:', err.message);
    if (req.path.startsWith('/api/')) return res.status(500).json({ error: '服务器内部错误' });
    res.status(500).send('服务器内部错误');
  });

  app.locals.resetRateLimits = resetRateLimits;
  app.locals.startTasks = async () => {
    await ensureSeeded(db);
    scheduleFetch(db, {
      onDone: (r) => {
        if (r.ok) console.log(`[itools] 汇率更新成功 (${r.source})`);
        else console.warn(`[itools] 汇率更新失败: ${r.error}（沿用库内缓存）`);
      },
    });
  };

  return app;
}
