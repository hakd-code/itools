// MD5 单测：以 node:crypto 为基准做随机对照
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { md5, md5Short } from '../public/js/md5.mjs';

function refMd5(str) {
  return createHash('md5').update(str, 'utf8').digest('hex');
}

test('RFC 1321 标准测试向量', () => {
  assert.equal(md5(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(md5('a'), '0cc175b9c0f1b6a831c399e269772661');
  assert.equal(md5('abc'), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(md5('message digest'), 'f96b697d7cb7938d525a2f31aaf161d0');
  assert.equal(md5('abcdefghijklmnopqrstuvwxyz'), 'c3fcd3d76192e4007dfb496cca67e13b');
  assert.equal(
    md5('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'),
    'd174ab98d277d9f5a5611c2c9f419d9f'
  );
});

test('中文 UTF-8 编码正确（与 node:crypto 对照）', () => {
  assert.equal(md5('你好，世界'), refMd5('你好，世界'));
  assert.equal(md5('中文 + English 混排 123'), refMd5('中文 + English 混排 123'));
  assert.equal(md5('😀 emoji'), refMd5('😀 emoji'));
});

test('随机长文本对照（覆盖多块填充，含 56/64/128 边界长度）', () => {
  for (const len of [0, 1, 55, 56, 57, 63, 64, 65, 127, 128, 1000, 4096]) {
    const s = randomBytes(len).toString('hex').slice(0, len); // 随机 hex 字符串
    assert.equal(md5(s), refMd5(s), `长度 ${len} 不匹配`);
  }
});

test('16 位短摘要 = 32 位串第 9~24 位 [8:24]', () => {
  const s = 'hello world';
  assert.equal(md5Short(s), refMd5(s).slice(8, 24));
  assert.equal(md5Short(s).length, 16);
});
