// 工具：随机密码生成（服务端 API）
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var useSymbols = $('useSymbols'), symbolsField = $('symbolsField');
  var lengthInput = $('length'), lengthVal = $('lengthVal');
  var generateBtn = $('generateBtn'), copyAllBtn = $('copyAllBtn');
  var pwdList = $('pwdList'), errorEl = $('pwdError');

  useSymbols.addEventListener('change', function () {
    symbolsField.hidden = !useSymbols.checked;
  });
  lengthInput.addEventListener('input', function () { lengthVal.textContent = lengthInput.value; });

  function symbolSet() {
    // 自动去重
    var raw = $('symbols').value;
    return [...new Set(raw.split(''))].join('');
  }

  generateBtn.addEventListener('click', async function () {
    errorEl.hidden = true;
    var anyClass = $('useDigits').checked || $('useLower').checked || $('useUpper').checked || useSymbols.checked;
    if (!anyClass) { showError('请至少勾选一种字符类型'); return; }
    if (useSymbols.checked && symbolSet().length === 0) {
      showError('已勾选"其他符号"，但符号集为空，请填写符号或取消勾选');
      return;
    }
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中…';
    try {
      var resp = await fetch('/api/tools/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          length: Number(lengthInput.value),
          count: Number($('count').value),
          useDigits: $('useDigits').checked,
          useLower: $('useLower').checked,
          useUpper: $('useUpper').checked,
          useSymbols: useSymbols.checked,
          symbols: symbolSet(),
        }),
      });
      var data = await resp.json();
      if (!resp.ok) { showError(data.error || '生成失败'); return; }
      render(data.passwords);
    } catch (e) {
      showError('网络异常，请重试');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = '生成密码';
    }
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function render(list) {
    pwdList.innerHTML = '';
    list.forEach(function (pwd, i) {
      var row = document.createElement('div');
      row.className = 'pwd-row';
      var code = document.createElement('code');
      code.textContent = pwd;
      var btn = document.createElement('button');
      btn.className = 'btn btn-mini';
      btn.textContent = '复制';
      btn.addEventListener('click', async function () {
        showToast(await window.copyText(pwd) ? '已复制第 ' + (i + 1) + ' 条' : '复制失败');
      });
      row.appendChild(code);
      row.appendChild(btn);
      pwdList.appendChild(row);
    });
    pwdList.hidden = false;
    copyAllBtn.disabled = false;
  }

  copyAllBtn.addEventListener('click', async function () {
    var text = Array.prototype.map.call(pwdList.querySelectorAll('code'), function (c) { return c.textContent; }).join('\n');
    showToast(await window.copyText(text) ? '已复制全部 ' + pwdList.children.length + ' 条' : '复制失败');
  });
})();
