// 汇率抓取与落库：主源 open.er-api.com，备源 frankfurter.dev，均失败时用库内缓存或内置基线数据
import { CURRENCIES } from './currencies.js';

const QUOTES = CURRENCIES.map((c) => c.code);
const FETCH_TIMEOUT = 8000;

async function fetchJson(url) {
  const resp = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** 主源：open.er-api.com（免费无 Key、币种全、含 MOP） */
async function fetchFromErApi() {
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  if (!data || data.result !== 'success' || !data.rates) throw new Error('主源响应格式异常');
  const rates = {};
  let missing = 0;
  for (const code of QUOTES) {
    const r = data.rates[code];
    if (typeof r === 'number' && r > 0) rates[code] = r;
    else missing++;
  }
  if (missing > 2) throw new Error(`主源缺少币种: 缺 ${missing} 个`);
  return { rates, source: 'er-api' };
}

/** 备源：frankfurter.dev（无 MOP，用于兜底） */
async function fetchFromFrankfurter(db) {
  const data = await fetchJson('https://api.frankfurter.dev/v1/latest?base=USD');
  if (!data || !data.rates) throw new Error('备源响应格式异常');
  const rates = {};
  for (const code of QUOTES) {
    if (code === 'USD') { rates[code] = 1; continue; }
    const r = data.rates[code];
    if (typeof r === 'number' && r > 0) rates[code] = r;
  }
  // 备源缺 MOP：沿用库内最近一次成功的 MOP 汇率（折算基准不变，仍为 USD）
  if (rates.MOP === undefined && db) {
    const prev = db.getLatestRates();
    if (prev && prev.rates.MOP) rates.MOP = prev.rates.MOP;
  }
  if (Object.keys(rates).length < QUOTES.length - 1) throw new Error('备源币种缺失过多');
  return { rates, source: 'frankfurter' };
}

/** 内置基线（2026-10-29 实抓），用于首次启动且外网不可达时兜底 */
function baselineRates() {
  return {
    USD: 1, CNY: 6.680538, EUR: 0.897215, GBP: 0.751538, HKD: 7.845294,
    JPY: 157.90537, KRW: 1340.24082, AUD: 1.419838, CAD: 1.401824, MOP: 8.080615,
    THB: 33.772095, TWD: 32.415976, SGD: 1.28178,
  };
}

/**
 * 抓取一次并落库（全量快照）。
 * @returns {{ ok: boolean, source?: string, error?: string }}
 */
export async function fetchAndStore(db) {
  try {
    const { rates, source } = await fetchFromErApi();
    db.insertRateSnapshot(rates, source);
    return { ok: true, source };
  } catch (err) {
    try {
      const { rates, source } = await fetchFromFrankfurter(db);
      db.insertRateSnapshot(rates, source);
      return { ok: true, source };
    } catch (err2) {
      return { ok: false, error: `主源: ${err.message}；备源: ${err2.message}` };
    }
  }
}

/** 启动时确保库内有数据：空库则立即抓取，再失败则写入内置基线（标注 source=baseline） */
export async function ensureSeeded(db) {
  if (db.getLatestRates()) return;
  const res = await fetchAndStore(db);
  if (!res.ok) {
    db.insertRateSnapshot(baselineRates(), 'baseline');
  }
}

/** 定时任务：每 6 小时抓取一次 */
export function scheduleFetch(db, { intervalHours = 6, onDone } = {}) {
  const run = async () => {
    const res = await fetchAndStore(db);
    onDone?.(res);
  };
  const timer = setInterval(run, intervalHours * 3600 * 1000);
  timer.unref?.();
  return { run, timer };
}
