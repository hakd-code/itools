// 工具：UUID 生成（Web Crypto 强随机，实时前端生成）
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var list = $('uuidList'), copyAllBtn = $('uuidCopyAllBtn');

  $('uuidGenBtn').addEventListener('click', function () {
    var count = Math.min(100, Math.max(1, Number($('uuidCount').value) || 10));
    var upper = $('uuidUpper').checked;
    var noHyphen = $('uuidNoHyphen').checked;
    list.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var u = crypto.randomUUID();
      if (noHyphen) u = u.replaceAll('-', '');
      if (upper) u = u.toUpperCase();
      addRow(u, i);
    }
    list.hidden = false;
    copyAllBtn.disabled = false;
  });

  function addRow(u, i) {
    var row = document.createElement('div');
    row.className = 'pwd-row';
    var code = document.createElement('code');
    code.textContent = u;
    var btn = document.createElement('button');
    btn.className = 'btn btn-mini';
    btn.textContent = '复制';
    btn.addEventListener('click', async function () {
      showToast(await window.copyText(u) ? '已复制第 ' + (i + 1) + ' 条' : '复制失败');
    });
    row.appendChild(code);
    row.appendChild(btn);
    list.appendChild(row);
  }

  copyAllBtn.addEventListener('click', async function () {
    var text = Array.prototype.map.call(list.querySelectorAll('code'), function (c) { return c.textContent; }).join('\n');
    showToast(await window.copyText(text) ? '已复制全部' : '复制失败');
  });
})();
