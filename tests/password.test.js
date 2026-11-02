// 随机密码生成单测：字符类保证 / 长度 / 符号自定义 / 非法参数 四类各 ≥3 例
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePasswords, ParamError, DEFAULT_SYMBOLS } from '../src/lib/password.js';

const CHAR_DIGITS = /[0-9]/;
const CHAR_LOWER = /[a-z]/;
const CHAR_UPPER = /[A-Z]/;

function classify(pwd, opts) {
  return {
    hasDigit: CHAR_DIGITS.test(pwd),
    hasLower: CHAR_LOWER.test(pwd),
    hasUpper: CHAR_UPPER.test(pwd),
    hasSymbol: opts.symbols ? [...pwd].some((ch) => opts.symbols.includes(ch)) : false,
  };
}

test('字符类保证：默认参数（数字+小写+大写）每个密码三类齐全', () => {
  const { passwords } = generatePasswords({ length: 10, count: 50 });
  assert.equal(passwords.length, 50);
  for (const pwd of passwords) {
    const c = classify(pwd, {});
    assert.ok(c.hasDigit, `缺数字: ${pwd}`);
    assert.ok(c.hasLower, `缺小写: ${pwd}`);
    assert.ok(c.hasUpper, `缺大写: ${pwd}`);
  }
});

test('字符类保证：勾选符号则每个密码至少 1 个符号', () => {
  const symbols = '@#%&';
  const { passwords } = generatePasswords({ length: 12, count: 50, useSymbols: true, symbols });
  for (const pwd of passwords) {
    const c = classify(pwd, { symbols });
    assert.ok(c.hasDigit && c.hasLower && c.hasUpper && c.hasSymbol, `字符类不全: ${pwd}`);
  }
});

test('字符类保证：仅勾选符号一类也可生成', () => {
  const symbols = '@#$';
  const { passwords } = generatePasswords({ length: 8, count: 10, useDigits: false, useLower: false, useUpper: false, useSymbols: true, symbols });
  for (const pwd of passwords) {
    assert.ok([...pwd].every((ch) => symbols.includes(ch)), `出现集合外字符: ${pwd}`);
  }
});

test('字符类保证：随机性抽样——50 个默认密码应有大量不同值', () => {
  const { passwords } = generatePasswords({ length: 16, count: 50 });
  assert.ok(new Set(passwords).size > 45, '随机性不足');
});

test('长度：默认 10', () => {
  const { passwords } = generatePasswords({});
  assert.equal(passwords.length, 10);
  assert.ok(passwords.every((p) => p.length === 10));
});

test('长度：边界 4 与 128', () => {
  assert.ok(generatePasswords({ length: 4, count: 5 }).passwords.every((p) => p.length === 4));
  assert.ok(generatePasswords({ length: 128, count: 3 }).passwords.every((p) => p.length === 128));
});

test('长度：超出 4~128 报错', () => {
  assert.throws(() => generatePasswords({ length: 3 }), ParamError);
  assert.throws(() => generatePasswords({ length: 129 }), ParamError);
});

test('长度：小于已选类数量的防御检查与最短长度限制', () => {
  // 长度 2 低于最短 4，报范围错误
  assert.throws(() => generatePasswords({ length: 2 }), /4 ~ 128/);
  // 防御分支：长度恰为 4 且勾满 4 类时合法（4 >= 4），不报字符类错误
  const { passwords } = generatePasswords({ length: 4, useDigits: true, useLower: true, useUpper: true, useSymbols: true, symbols: '@' });
  assert.equal(passwords.length >= 1, true);
});

test('符号自定义：默认符号集可用', () => {
  const { passwords } = generatePasswords({ length: 12, count: 20, useSymbols: true });
  for (const pwd of passwords) {
    assert.ok([...pwd].some((ch) => DEFAULT_SYMBOLS.includes(ch)), `无符号: ${pwd}`);
  }
});

test('符号自定义：自动去重（重复字符只算一个）且全部来自去重后集合', () => {
  const symbols = 'aa@@##';
  const uniq = [...new Set(symbols.split(''))].join('');
  const { passwords } = generatePasswords({ length: 10, count: 30, useDigits: false, useLower: false, useUpper: false, useSymbols: true, symbols });
  for (const pwd of passwords) {
    assert.ok([...pwd].every((ch) => uniq.includes(ch)), `出现集合外字符: ${pwd}`);
  }
});

test('符号自定义：符号框为空报错', () => {
  assert.throws(() => generatePasswords({ useSymbols: true, symbols: '' }), /符号集为空/);
});

test('非法参数：数量越界 / 非整数 / 全不勾选', () => {
  assert.throws(() => generatePasswords({ count: 0 }), /数量/);
  assert.throws(() => generatePasswords({ count: 101 }), /数量/);
  assert.throws(() => generatePasswords({ count: 2.5 }), /整数/);
  assert.throws(() => generatePasswords({ useDigits: false, useLower: false, useUpper: false }), /至少勾选/);
  assert.throws(() => generatePasswords({ length: 'abc' }), /整数/);
});

test('非法参数：错误对象带 status=400', () => {
  try {
    generatePasswords({ length: 2 });
    assert.fail('应当抛出');
  } catch (err) {
    assert.equal(err.status, 400);
  }
});

test('数量上限：一次最多 100 个', () => {
  const { passwords } = generatePasswords({ count: 100 });
  assert.equal(passwords.length, 100);
  assert.throws(() => generatePasswords({ count: 101 }), ParamError);
});
