// SQLite 数据访问层（node:sqlite 内置模块，无原生编译依赖）
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS exchange_rates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  base_ccy    TEXT NOT NULL,
  quote_ccy   TEXT NOT NULL,
  rate        REAL NOT NULL,
  source      TEXT,
  fetched_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rates_fetched ON exchange_rates (base_ccy, fetched_at);
`;

export function openDb(dbPath) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec(SCHEMA);

  const insertStmt = sqlite.prepare(
    'INSERT INTO exchange_rates (base_ccy, quote_ccy, rate, source, fetched_at) VALUES (?, ?, ?, ?, ?)'
  );

  return {
    sqlite,

    /** 写入一次全量快照（同一 fetched_at） */
    insertRateSnapshot(rates, source) {
      const fetchedAt = new Date().toISOString();
      const tx = sqlite.exec('BEGIN');
      try {
        for (const [quote, rate] of Object.entries(rates)) {
          insertStmt.run('USD', quote, rate, source, fetchedAt);
        }
        sqlite.exec('COMMIT');
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
      return fetchedAt;
    },

    /** 取 base 下 fetched_at 最新的一组汇率 */
    getLatestRates() {
      const row = sqlite.prepare(
        'SELECT fetched_at, source FROM exchange_rates WHERE base_ccy = ? ORDER BY fetched_at DESC LIMIT 1'
      ).get('USD');
      if (!row) return null;
      const rows = sqlite.prepare(
        'SELECT quote_ccy, rate FROM exchange_rates WHERE base_ccy = ? AND fetched_at = ?'
      ).all('USD', row.fetched_at);
      const rates = {};
      for (const r of rows) rates[r.quote_ccy] = r.rate;
      return { rates, updatedAt: row.fetched_at, source: row.source };
    },

    close() {
      sqlite.close();
    },
  };
}
