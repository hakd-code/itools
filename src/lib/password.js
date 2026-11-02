import { randomInt } from 'node:crypto';

/** 默认符号集（可在前端自定义，服务端自动去重） */
export const DEFAULT_SYMBOLS = '~!@#$%^&*()-+_=.';

const CLASSES = {
  digits: '0123456789',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
};

export class ParamError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

function toInt(v, name, min, max, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  if (!Number.isInteger(n)) throw new ParamError(`${name} 必须是整数`);
  if (n < min || n > max) throw new ParamError(`${name} 需在 ${min} ~ ${max} 之间`);
  return n;
}

/**
 * 生成随机密码。
 * 算法：先从每个已勾选字符类各随机取 1 个字符（保证"至少出现一次"），
 * 再从全部字符集并集随机补齐到目标长度，最后 Fisher–Yates 洗牌。
 * 随机源一律使用 crypto.randomInt（内部拒绝采样，无模偏差）。
 */
export function generatePasswords(opts = {}) {
  const length = toInt(opts.length, '密码长度', 4, 128, 10);
  const count = toInt(opts.count, '生成数量', 1, 100, 10);
  const useDigits = opts.useDigits !== false;
  const useLower = opts.useLower !== false;
  const useUpper = opts.useUpper !== false;
  const useSymbols = opts.useSymbols === true;

  const rawSymbols = typeof opts.symbols === 'string' ? opts.symbols : DEFAULT_SYMBOLS;
  // 自动去重
  const symbolChars = useSymbols ? [...new Set([...rawSymbols.trim()])] : [];

  const selected = [];
  if (useDigits) selected.push(CLASSES.digits);
  if (useLower) selected.push(CLASSES.lower);
  if (useUpper) selected.push(CLASSES.upper);
  if (useSymbols) {
    if (symbolChars.length === 0) {
      throw new ParamError('已勾选"其他符号"，但符号集为空，请填写符号或取消勾选');
    }
    selected.push(symbolChars.join(''));
  }

  if (selected.length === 0) {
    throw new ParamError('请至少勾选一种字符类型');
  }
  if (length < selected.length) {
    throw new ParamError(`密码长度（${length}）不能小于已选字符类数量（${selected.length}）`);
  }

  const pool = [...new Set(selected.join('').split(''))];
  const pick = (chars) => chars[randomInt(chars.length)];
  const passwords = [];

  for (let i = 0; i < count; i++) {
    const chars = selected.map((cls) => pick(cls));
    while (chars.length < length) chars.push(pick(pool));
    // Fisher–Yates 洗牌（randomInt 强随机）
    for (let j = chars.length - 1; j > 0; j--) {
      const k = randomInt(j + 1);
      [chars[j], chars[k]] = [chars[k], chars[j]];
    }
    passwords.push(chars.join(''));
  }

  return { passwords };
}
