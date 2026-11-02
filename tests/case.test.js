// 大小写转换单测：6 模式全覆盖（含中文混排样例）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toUpper, toLower, toTitleCase, toSentenceCase, toSwapCase, toCamelCase, convert, MODES,
} from '../public/js/case-core.mjs';

test('全部大写', () => {
  assert.equal(toUpper('hello world'), 'HELLO WORLD');
  assert.equal(toUpper('HeLLo'), 'HELLO');
  assert.equal(toUpper('你好 world123'), '你好 WORLD123');
  assert.equal(toUpper(''), '');
});

test('全部小写', () => {
  assert.equal(toLower('HeLLo'), 'hello');
  assert.equal(toLower('ABC DEF'), 'abc def');
  assert.equal(toLower('中文ABC'), '中文abc');
});

test('单词首字母大写（单词 = 字母连续段，- _ 视为分隔）', () => {
  assert.equal(toTitleCase('hello world'), 'Hello World');
  assert.equal(toTitleCase('HELLO WORLD'), 'Hello World');
  assert.equal(toTitleCase('hello-world foo_bar'), 'Hello-World Foo_Bar');
  assert.equal(toTitleCase('中文 hello'), '中文 Hello');
  assert.equal(toTitleCase("it's ok"), "It's Ok");
});

test('句首字母大写（以 . ! ? 和换行分句）', () => {
  assert.equal(toSentenceCase('hello. ok'), 'Hello. Ok');
  assert.equal(toSentenceCase('WHAT! really? yes.\nnew line'), 'What! Really? Yes.\nNew line');
  assert.equal(toSentenceCase('a.b.c'), 'A.B.C');
  assert.equal(toSentenceCase('中文。hello'), '中文。Hello');
  assert.equal(toSentenceCase('HELLO world'), 'Hello world');
});

test('大小写反转（逐字符 swapcase，中文保留）', () => {
  assert.equal(toSwapCase('HeLLo'), 'hEllO');
  assert.equal(toSwapCase('AbC 中文'), 'aBc 中文');
  assert.equal(toSwapCase('aB1!'), 'Ab1!');
});

test('驼峰命名（按空格 / - / _ 切词）', () => {
  assert.equal(toCamelCase('foo bar-id_name'), 'fooBarIdName');
  assert.equal(toCamelCase('hello world'), 'helloWorld');
  assert.equal(toCamelCase('Foo Bar'), 'fooBar');
  assert.equal(toCamelCase('  multiple   spaces  '), 'multipleSpaces');
  assert.equal(toCamelCase('XML HTTP request'), 'xmlHttpRequest');
  assert.equal(toCamelCase('中文 test case'), '中文TestCase'); // 中文视为首词内容保留
  assert.equal(toCamelCase(''), '');
  assert.equal(toCamelCase('---'), '');
});

test('convert 入口与 MODES 注册一致', () => {
  assert.equal(Object.keys(MODES).length, 6);
  assert.equal(convert('hello world', 'title'), 'Hello World');
  assert.equal(convert('a b', 'camel'), 'aB');
  assert.throws(() => convert('x', 'nope'), /未知模式/);
});
