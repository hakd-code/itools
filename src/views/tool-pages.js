// 六个工具页模板
import { layout, esc, toolHeader } from './layout.js';
import { DEFAULT_SYMBOLS } from '../lib/password.js';
import { CURRENCIES } from '../lib/currencies.js';

function page(title, description, inner, scripts) {
  return layout({ title, description, content: `${toolHeader(title)}\n${inner}`, scripts });
}

/* ① 随机密码生成 */
export function passwordPage() {
  const symbolOptions = DEFAULT_SYMBOLS.split('').map((ch) =>
    `<option value="${esc(ch)}">${esc(ch)}</option>`).join('');
  const inner = `
  <div class="tool-panel">
    <div class="form-grid">
      <div class="field">
        <label class="field-label">字符集</label>
        <div class="check-row">
          <label class="check"><input type="checkbox" id="useDigits" checked> 数字 (0-9)</label>
          <label class="check"><input type="checkbox" id="useLower" checked> 小写字母 (a-z)</label>
          <label class="check"><input type="checkbox" id="useUpper" checked> 大写字母 (A-Z)</label>
          <label class="check"><input type="checkbox" id="useSymbols"> 其他符号</label>
        </div>
      </div>
      <div class="field" id="symbolsField" hidden>
        <label class="field-label" for="symbols">其他符号（自动去重）</label>
        <input class="input mono" id="symbols" value="${esc(DEFAULT_SYMBOLS)}" spellcheck="false">
        <div class="chips" id="symbolChips">${symbolOptions}</div>
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label" for="length">长度：<span id="lengthVal">10</span></label>
          <input type="range" id="length" min="4" max="128" value="10" step="1">
        </div>
        <div class="field">
          <label class="field-label" for="count">数量</label>
          <input type="number" class="input" id="count" value="10" min="1" max="100">
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="generateBtn">生成密码</button>
        <button class="btn btn-ghost" id="copyAllBtn" disabled>复制全部</button>
      </div>
      <p class="form-error" id="pwdError" hidden></p>
    </div>
    <div class="pwd-list mono" id="pwdList" hidden></div>
  </div>
  <p class="tool-note">密码由服务端 node:crypto 强随机生成（crypto.randomInt 拒绝采样，无模偏差），保证每种已勾选字符类至少出现一次。生成结果不记录、不落库。</p>`;
  return page('随机密码生成', '服务端 crypto 强随机密码生成器，支持自定义符号集、长度 4-128、批量生成与字符类覆盖保证', inner, ['/js/tool-password.js']);
}

/* ② 汇率换算 */
export function exchangePage() {
  const options = CURRENCIES.map((c) =>
    `<option value="${c.code}">${c.code} · ${esc(c.name)}</option>`).join('');
  const inner = `
  <div class="tool-panel">
    <div class="exchange-box">
      <div class="exchange-side">
        <select id="fromCcy" class="input select" aria-label="源币种">${options}</select>
        <input id="amount" class="input amount mono" inputmode="decimal" value="100" aria-label="金额">
      </div>
      <button class="btn btn-icon swap-btn" id="swapBtn" type="button" title="互换币种" aria-label="互换币种">⇄</button>
      <div class="exchange-side">
        <select id="toCcy" class="input select" aria-label="目标币种">${options}</select>
        <output id="result" class="amount mono result-amount">--</output>
      </div>
    </div>
    <div class="rate-info" id="rateInfo" hidden>
      <p class="rate-line" id="rateLine"></p>
      <p class="rate-meta"><span id="rateSource"></span> · 数据更新时间：<time id="rateTime"></time></p>
      <p class="rate-stale" id="rateStale" hidden>⚠ 数据可能滞后（联网更新失败，正在使用库内最近一次成功数据）</p>
    </div>
    <p class="form-error" id="rateError" hidden></p>
    <table class="rate-table" id="rateTable" hidden>
      <caption class="sr-only">常用币种对当前币种汇率</caption>
      <thead><tr><th>币种</th><th id="tableHeadRight">兑换率</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>
  <p class="tool-note">汇率数据来源 open.er-api.com（备源 frankfurter.dev），服务端每 6 小时自动更新并落库。</p>`;
  return page('汇率换算', '13 种常用币种实时汇率换算，USD/CNY/EUR/GBP/JPY/HKD 等，每 6 小时自动更新', inner, ['/js/tool-exchange.js']);
}

/* ③ UUID 生成 */
export function uuidPage() {
  const inner = `
  <div class="tool-panel">
    <div class="field-row">
      <div class="field">
        <label class="field-label" for="uuidCount">生成数量（≤ 100）</label>
        <input type="number" class="input" id="uuidCount" value="10" min="1" max="100">
      </div>
      <div class="field">
        <label class="field-label">选项</label>
        <div class="check-row">
          <label class="check"><input type="checkbox" id="uuidUpper"> 大写</label>
          <label class="check"><input type="checkbox" id="uuidNoHyphen"> 去连字符</label>
        </div>
      </div>
      <div class="field btn-field">
        <button class="btn btn-primary" id="uuidGenBtn">生成</button>
        <button class="btn btn-ghost" id="uuidCopyAllBtn" disabled>复制全部</button>
      </div>
    </div>
    <div class="pwd-list mono" id="uuidList" hidden></div>
  </div>
  <p class="tool-note">UUID v4 由浏览器 Web Crypto（crypto.randomUUID）实时生成，强随机、不经过网络。可叠加「大写」与「去连字符」开关。</p>`;
  return page('UUID 生成', '批量生成 UUID v4，支持大写与去连字符，Web Crypto 强随机，本地处理', inner, ['/js/tool-uuid.js']);
}

/* ④ MD5 加密 */
export function md5Page() {
  const inner = `
  <div class="tool-panel">
    <div class="field">
      <label class="field-label" for="md5Input">输入任意文本（实时计算，无需点按钮）</label>
      <textarea class="input textarea mono" id="md5Input" rows="4" placeholder="在此输入或粘贴文本…" spellcheck="false"></textarea>
    </div>
    <div class="md5-results">
      <div class="md5-item"><span class="md5-label">32 位小写</span><code class="mono" id="md5Lower32">--</code><button class="btn btn-mini copy-btn" data-copy-target="md5Lower32">复制</button></div>
      <div class="md5-item"><span class="md5-label">32 位大写</span><code class="mono" id="md5Upper32">--</code><button class="btn btn-mini copy-btn" data-copy-target="md5Upper32">复制</button></div>
      <div class="md5-item"><span class="md5-label">16 位小写</span><code class="mono" id="md5Lower16">--</code><button class="btn btn-mini copy-btn" data-copy-target="md5Lower16">复制</button></div>
      <div class="md5-item"><span class="md5-label">16 位大写</span><code class="mono" id="md5Upper16">--</code><button class="btn btn-mini copy-btn" data-copy-target="md5Upper16">复制</button></div>
    </div>
  </div>
  <p class="tool-note">纯前端计算（文本不离开浏览器）。注意：MD5 不可逆，且已不具抗碰撞性，<strong>不建议用于密码存储</strong>，仅适用于校验、缓存键等场景。</p>`;
  return page('MD5 加密', '在线 MD5 加密工具，一次返回 32/16 位大小写四种结果，纯前端实时计算', inner, ['/js/tool-md5.js']);
}

/* ⑤ 大小写转换 */
export function casePage() {
  const modes = [
    ['upper', '全部大写'], ['lower', '全部小写'], ['title', '单词首字母大写'],
    ['sentence', '句首字母大写'], ['swap', '大小写反转'], ['camel', '驼峰命名'],
  ];
  const inner = `
  <div class="tool-panel">
    <div class="field">
      <label class="field-label" for="caseInput">输入文本（中文字符保留原样，不参与转换）</label>
      <textarea class="input textarea" id="caseInput" rows="5" placeholder="hello world / foo bar-id_name …" spellcheck="false"></textarea>
    </div>
    <div class="mode-btns" id="modeBtns" role="tablist">
      ${modes.map(([m, label]) => `<button class="btn btn-mode" data-mode="${m}" type="button">${label}</button>`).join('\n      ')}
    </div>
    <div class="field">
      <div class="field-label result-label">转换结果
        <span class="char-count" id="charCount" hidden></span>
        <button class="btn btn-mini copy-btn" id="caseCopyBtn" hidden>复制结果</button>
      </div>
      <div class="result-box" id="caseResult">点击上方模式按钮开始转换</div>
    </div>
  </div>`;
  return page('大小写转换', '英文字母大小写转换：全部大写/小写、句首大写、驼峰命名、大小写反转，支持中英混排', inner, ['/js/tool-case.js']);
}

/* ⑥ 文本对比 */
export function diffPage() {
  const inner = `
  <div class="tool-panel">
    <div class="diff-options">
      <label class="check"><input type="checkbox" id="diffIgnoreCase"> 忽略大小写</label>
      <label class="check"><input type="checkbox" id="diffOnlyChanges"> 仅显示差异行</label>
      <div class="seg-toggle" id="diffViewToggle" role="tablist">
        <button class="seg-btn active" data-view="split" type="button">并排视图</button>
        <button class="seg-btn" data-view="unified" type="button">统一视图</button>
      </div>
    </div>
    <div class="diff-stats" id="diffStats" hidden>
      <span class="badge badge-add" id="statAdd">新增 0 行</span>
      <span class="badge badge-del" id="statDel">删除 0 行</span>
      <span class="diff-status" id="diffStatus"></span>
    </div>
    <div class="diff-inputs" id="diffInputs">
      <div class="diff-pane">
        <label class="field-label" for="oldText">原文本</label>
        <textarea class="input textarea mono" id="oldText" rows="12" placeholder="粘贴原文本…" spellcheck="false"></textarea>
      </div>
      <div class="diff-pane">
        <label class="field-label" for="newText">新文本</label>
        <textarea class="input textarea mono" id="newText" rows="12" placeholder="粘贴新文本…" spellcheck="false"></textarea>
      </div>
    </div>
    <div class="btn-row"><button class="btn btn-primary" id="diffRunBtn">对比</button><button class="btn btn-ghost" id="diffClearBtn">清空</button></div>
    <div class="diff-view" id="diffView" hidden></div>
  </div>
  <p class="tool-note">全部在浏览器本地完成（文本不上传服务器）：行级 Myers 算法对齐 + 行内字符级高亮，超过 5000 行自动转入后台计算避免卡顿。</p>`;
  return page('文本对比', '在线文本对比（diff）：左右分栏行号对齐、字符级高亮、并排/统一视图、忽略大小写', inner, ['/js/tool-diff.js']);
}
