// 工具：汇率换算
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var fromCcy = $('fromCcy'), toCcy = $('toCcy'), amount = $('amount');
  var result = $('result'), swapBtn = $('swapBtn');
  var rateInfo = $('rateInfo'), rateLine = $('rateLine'), rateTime = $('rateTime');
  var rateSource = $('rateSource'), rateStale = $('rateStale'), rateError = $('rateError');
  var rateTable = $('rateTable');
  var RATES = null;

  fromCcy.value = 'USD'; toCcy.value = 'CNY'; // 默认 USD → CNY

  function parseAmount() {
    var raw = amount.value.replace(/[,，\s]/g, ''); // 支持千分位
    var n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return '--';
    var abs = Math.abs(n);
    var digits = abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
    return n.toLocaleString('zh-CN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  }

  function convert() {
    if (!RATES) return;
    var a = parseAmount();
    if (a === null) { result.textContent = '--'; return; }
    var f = fromCcy.value, t = toCcy.value;
    var usd = a / RATES[f];        // 先折算为 USD
    var val = usd * RATES[t];
    result.textContent = fmt(val);
    var unit = RATES[t] / RATES[f];
    var back = RATES[f] / RATES[t];
    rateLine.innerHTML = '';
    rateLine.append('1 ' + f + ' = ' + fmt(unit) + ' ' + t + '　·　1 ' + t + ' = ' + fmt(back) + ' ' + f);
  }

  function renderTable() {
    if (!RATES) return;
    var base = fromCcy.value;
    var usdPerBase = RATES[base];
    var tbody = rateTable.querySelector('tbody');
    tbody.innerHTML = '';
    var codes = Object.keys(RATES).filter(function (c) { return c !== base; });
    codes.sort();
    codes.forEach(function (code) {
      var rate = RATES[code] / usdPerBase;
      var tr = document.createElement('tr');
      var td1 = document.createElement('td'); td1.textContent = code;
      var td2 = document.createElement('td'); td2.className = 'num'; td2.textContent = fmt(rate);
      tr.appendChild(td1); tr.appendChild(td2);
      tbody.appendChild(tr);
    });
    $('tableHeadRight').textContent = '1 ' + base + ' 兑换';
  }

  async function load() {
    rateError.hidden = true;
    try {
      var resp = await fetch('/api/tools/rates?base=USD');
      var data = await resp.json();
      if (!resp.ok) { rateError.textContent = data.error || '汇率加载失败'; rateError.hidden = false; return; }
      RATES = data.rates;
      rateInfo.hidden = false;
      rateStale.hidden = !data.stale;
      rateSource.textContent = '数据源: ' + (data.source === 'er-api' ? 'open.er-api.com' : data.source === 'frankfurter' ? 'frankfurter.dev' : data.source === 'baseline' ? '内置基线' : data.source);
      rateTime.textContent = new Date(data.updatedAt).toLocaleString('zh-CN', { hour12: false });
      convert();
      renderTable();
    } catch (e) {
      rateError.textContent = '网络异常，汇率加载失败';
      rateError.hidden = false;
    }
  }

  amount.addEventListener('input', convert);
  fromCcy.addEventListener('change', function () {
    if (fromCcy.value === toCcy.value) toCcy.value = fromCcy.value === 'USD' ? 'CNY' : 'USD';
    convert(); renderTable();
  });
  toCcy.addEventListener('change', function () {
    if (toCcy.value === fromCcy.value) fromCcy.value = toCcy.value === 'USD' ? 'CNY' : 'USD';
    convert(); renderTable();
  });
  swapBtn.addEventListener('click', function () {
    var tmp = fromCcy.value; fromCcy.value = toCcy.value; toCcy.value = tmp;
    convert(); renderTable();
  });

  load();
})();
