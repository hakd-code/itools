// API 集成测试：页面路由 + 密码 API（含限流）+ 汇率 API
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server, base, app;

before(async () => {
  app = createApp({ dbPath: ':memory:' });
  await app.locals.startTasks();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => new Promise((resolve) => server.close(resolve)));

test('GET / 返回首页且包含全部 6 个工具卡片', async () => {
  const resp = await fetch(base + '/');
  assert.equal(resp.status, 200);
  const html = await resp.text();
  assert.match(html, /随机密码生成/);
  assert.match(html, /汇率换算/);
  assert.match(html, /UUID 生成/);
  assert.match(html, /MD5 加密/);
  assert.match(html, /大小写转换/);
  assert.match(html, /文本对比/);
  assert.match(html, /toolSearch/);
  assert.equal(resp.headers.get('content-type').includes('text/html'), true);
});

test('六个工具页均可访问', async () => {
  for (const slug of ['password', 'exchange', 'uuid', 'md5', 'case', 'diff']) {
    const resp = await fetch(`${base}/tools/${slug}/`);
    assert.equal(resp.status, 200, `${slug} 页面应 200`);
    const html = await resp.text();
    assert.match(html, /全部工具/); // 面包屑
  }
});

test('POST /api/tools/password 默认参数返回 10 个 10 位密码', async () => {
  const resp = await fetch(base + '/api/tools/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(resp.status, 200);
  const data = await resp.json();
  assert.equal(data.passwords.length, 10);
  for (const p of data.passwords) {
    assert.equal(p.length, 10);
    assert.match(p, /[0-9]/);
    assert.match(p, /[a-z]/);
    assert.match(p, /[A-Z]/);
  }
});

test('POST /api/tools/password 参数校验返回 400 + 中文错误', async () => {
  const cases = [
    { length: 2 },                        // 长度小于类数量
    { length: 999 },                      // 越界
    { count: 101 },                       // 数量越界
    { useDigits: false, useLower: false, useUpper: false }, // 全不勾选
    { useSymbols: true, symbols: '' },    // 符号为空
  ];
  for (const body of cases) {
    const resp = await fetch(base + '/api/tools/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(resp.status, 400, JSON.stringify(body));
    const data = await resp.json();
    assert.ok(data.error, '应有中文错误信息');
    assert.match(data.error, /[\u4e00-\u9fa5]/);
  }
});

test('POST /api/tools/password 符号自定义生效', async () => {
  const resp = await fetch(base + '/api/tools/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ length: 12, count: 20, useSymbols: true, symbols: '@#$%' }),
  });
  const { passwords } = await resp.json();
  for (const p of passwords) {
    assert.ok([...p].some((ch) => '@#$%'.includes(ch)), `应含符号: ${p}`);
  }
});

test('限流：密码接口 60 次/分钟/IP，超限返回 429', async () => {
  // 注：前面的测试已消耗少量配额，这里从新端口起的服务实例测试不受影响；
  // 直接在本实例上打满剩余配额并断言 429 出现
  let got429 = false;
  for (let i = 0; i < 65; i++) {
    const resp = await fetch(base + '/api/tools/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ length: 4, count: 1 }),
    });
    if (resp.status === 429) {
      got429 = true;
      assert.ok(resp.headers.get('retry-after'));
      const data = await resp.json();
      assert.match(data.error, /频繁/);
      break;
    }
  }
  assert.ok(got429, '应触发限流 429');
});

test('GET /api/tools/rates 返回 13 币种快照', async () => {
  const resp = await fetch(base + '/api/tools/rates?base=USD');
  assert.equal(resp.status, 200);
  const data = await resp.json();
  assert.equal(data.base, 'USD');
  assert.equal(typeof data.updatedAt, 'string');
  assert.ok(data.source);
  const expected = ['USD', 'CNY', 'EUR', 'GBP', 'HKD', 'JPY', 'KRW', 'AUD', 'CAD', 'MOP', 'THB', 'TWD', 'SGD'];
  for (const code of expected) {
    assert.ok(typeof data.rates[code] === 'number' && data.rates[code] > 0, `缺币种 ${code}`);
  }
  assert.equal(data.rates.USD, 1);
});

test('GET /api/tools/rates/currencies 返回币种中文名', async () => {
  const resp = await fetch(base + '/api/tools/rates/currencies');
  const data = await resp.json();
  assert.equal(data.currencies.length, 13);
  const cny = data.currencies.find((c) => c.code === 'CNY');
  assert.equal(cny.name, '人民币');
});

test('未知 API 返回 404 JSON', async () => {
  const resp = await fetch(base + '/api/nothing');
  assert.equal(resp.status, 404);
  const data = await resp.json();
  assert.ok(data.error);
});
