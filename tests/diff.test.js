// diff 引擎单测：正确性属性 + 对齐模型 + 字符级 + 性能
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { diffArrays, diffLines, diffChars, alignRows, diffStats } from '../public/js/diff-core.mjs';

/** 属性校验：脚本重建 b == 原 b，且 same 两侧相等、索引单调 */
function validate(a, b, script, eq = (x, y) => x === y) {
  let rebuilt = '';
  let lastA = -1, lastB = -1;
  for (const item of script) {
    if (item.type === 'same') {
      assert.ok(eq(item.a, item.b), 'same 项两侧应相等');
      assert.ok(item.aIndex > lastA && item.bIndex > lastB, 'same 索引应单调递增');
      lastA = item.aIndex; lastB = item.bIndex;
      rebuilt += item.a;
    } else if (item.type === 'del') {
      assert.ok(item.aIndex > lastA, 'del 索引应单调递增');
      lastA = item.aIndex;
      // del 项不进入重建
    } else if (item.type === 'add') {
      assert.ok(item.bIndex > lastB, 'add 索引应单调递增');
      lastB = item.bIndex;
      rebuilt += item.b;
    }
  }
  assert.equal(rebuilt, b.join(''), '按脚本重建应得到 b');
  // del/add 应覆盖 a、b 中所有未匹配元素
  const delCount = script.filter((s) => s.type === 'del').length;
  const addCount = script.filter((s) => s.type === 'add').length;
  assert.equal(script.filter((s) => s.type === 'same').length + delCount, a.length, 'same+del 覆盖 a');
  assert.equal(script.filter((s) => s.type === 'same').length + addCount, b.length, 'same+add 覆盖 b');
}

test('基础用例：插入 / 删除 / 替换 / 相同', () => {
  validate(['a', 'b', 'c'], ['a', 'b', 'c', 'd'], diffArrays(['a', 'b', 'c'], ['a', 'b', 'c', 'd']));
  validate(['a', 'b', 'c'], ['a', 'c'], diffArrays(['a', 'b', 'c'], ['a', 'c']));
  validate(['a', 'x', 'c'], ['a', 'y', 'c'], diffArrays(['a', 'x', 'c'], ['a', 'y', 'c']));
  validate([], ['a', 'b'], diffArrays([], ['a', 'b']));
  validate(['a', 'b'], [], diffArrays(['a', 'b'], []));
  validate(['a'], ['b'], diffArrays(['a'], ['b']));
});

test('经典用例：kitten → sitting', () => {
  const script = diffArrays([... 'kitten'], [... 'sitting']);
  validate([... 'kitten'], [... 'sitting'], script);
  // 编辑距离 3（k→s、e→i、+g）；脚本中替换 = del+add 两条目，故非同类条目为 5
  assert.equal(script.filter((s) => s.type !== 'same').length, 5);
  assert.equal(script.filter((s) => s.type === 'same').length, 4); // LCS = ittn
});

test('随机属性测试：200 组随机序列全部通过重建校验', () => {
  const CHARS = 'abcde';
  for (let t = 0; t < 200; t++) {
    const n = randomInt(0, 30), m = randomInt(0, 30);
    const a = Array.from({ length: n }, () => CHARS[randomInt(CHARS.length)]);
    const b = Array.from({ length: m }, () => CHARS[randomInt(CHARS.length)]);
    validate(a, b, diffArrays(a, b));
  }
});

test('随机属性测试：大字母表场景（更长公共子串）', () => {
  const CHARS = 'abcdefghij';
  for (let t = 0; t < 100; t++) {
    const n = randomInt(0, 60), m = randomInt(0, 60);
    const a = Array.from({ length: n }, () => CHARS[randomInt(CHARS.length)]);
    const b = Array.from({ length: m }, () => CHARS[randomInt(CHARS.length)]);
    validate(a, b, diffArrays(a, b));
  }
});

test('自定义相等函数：忽略大小写', () => {
  const script = diffArrays(['Hello', 'world'], ['hello', 'WORLD'], (x, y) => x.toLowerCase() === y.toLowerCase());
  assert.ok(script.every((s) => s.type === 'same'));
});

test('diffLines：行对齐与行号（强制替换对为 pair）', () => {
  const script = diffLines('a\nb\nc', 'a\nX\nc');
  validate('a\nb\nc'.split('\n'), 'a\nX\nc'.split('\n'), script);
  const rows = alignRows(script);
  assert.deepEqual(rows.map((r) => r.type), ['same', 'pair', 'same']);
  assert.deepEqual(rows.map((r) => r.oldNo), [1, 2, 3]);
  assert.deepEqual(rows.map((r) => r.newNo), [1, 2, 3]);
});

test('diffLines：等距离的另一种最优对齐也必须通过重建校验', () => {
  // a b c → a c d：可对齐为 b↔c 或删除 b，两者均为合法最优解
  const script = diffLines('a\nb\nc', 'a\nc\nd');
  validate('a\nb\nc'.split('\n'), 'a\nc\nd'.split('\n'), script);
});

test('alignRows：一侧删除时另一侧空行占位（行号严格对齐）', () => {
  const script = diffLines('a\nb\nc\nd', 'b\nd');
  const rows = alignRows(script);
  assert.deepEqual(rows.map((r) => r.type), ['del', 'same', 'del', 'same']);
  assert.deepEqual(rows.map((r) => r.oldNo), [1, 2, 3, 4]);
  assert.deepEqual(rows.map((r) => r.newNo), [null, 1, null, 2]);
});

test('alignRows：连续删除+新增配对成 pair 行', () => {
  const script = diffLines('x\ny', 'p\nq\nr');
  const rows = alignRows(script);
  assert.deepEqual(rows.map((r) => r.type), ['pair', 'pair', 'add']);
  assert.equal(rows[0].oldText, 'x'); assert.equal(rows[0].newText, 'p');
  assert.equal(rows[2].oldNo, null);
});

test('diffStats 统计', () => {
  const s = diffStats(diffLines('a\nb\nc\nd', 'a\nx\nd\ne\nf'));
  assert.equal(s.removed, 2);
  assert.equal(s.added, 3);
});

test('diffChars：行内字符级高亮片段', () => {
  const parts = diffChars('hello world', 'hello brave world');
  assert.deepEqual(parts, [
    { type: 'same', text: 'hello ' },
    { type: 'add', text: 'brave ' },
    { type: 'same', text: 'world' },
  ]);
  const parts2 = diffChars('foobar', 'fobar');
  assert.deepEqual(parts2, [
    { type: 'same', text: 'fo' },
    { type: 'del', text: 'o' },
    { type: 'same', text: 'bar' },
  ]);
});

test('性能：5000 行相似文本在 2 秒内完成', () => {
  const a = [];
  const b = [];
  for (let i = 0; i < 5000; i++) {
    a.push(`line ${i}: the quick brown fox`);
    b.push(i % 100 === 0 ? `line ${i}: CHANGED` : `line ${i}: the quick brown fox`);
  }
  const t0 = performance.now();
  const script = diffLines(a.join('\n'), b.join('\n'));
  const ms = performance.now() - t0;
  validate(a, b, script);
  assert.ok(ms < 2000, `耗时 ${ms.toFixed(0)}ms 超出预算`);
});

test('性能兜底：完全不同的超大文本不崩（退化整块替换）', () => {
  const a = Array.from({ length: 3000 }, (_, i) => `old-${i}-${'x'.repeat(20)}`);
  const b = Array.from({ length: 3000 }, (_, i) => `new-${i}-${'y'.repeat(20)}`);
  const script = diffLines(a.join('\n'), b.join('\n'));
  const s = diffStats(script);
  assert.equal(s.removed, 3000);
  assert.equal(s.added, 3000);
});
