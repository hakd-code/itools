// 工具：MD5 加密（纯前端实时计算，一次返回四种结果）
import { md5 } from './md5.mjs';

(function () {
  'use strict';
  var input = document.getElementById('md5Input');
  var out = {
    lower32: document.getElementById('md5Lower32'),
    upper32: document.getElementById('md5Upper32'),
    lower16: document.getElementById('md5Lower16'),
    upper16: document.getElementById('md5Upper16'),
  };

  function update() {
    var text = input.value;
    if (!text) {
      out.lower32.textContent = out.upper32.textContent = out.lower16.textContent = out.upper16.textContent = '--';
      return;
    }
    var h = md5(text);
    out.lower32.textContent = h;
    out.upper32.textContent = h.toUpperCase();
    out.lower16.textContent = h.slice(8, 24); // 16 位 = 32 位串第 9~24 位
    out.upper16.textContent = h.slice(8, 24).toUpperCase();
  }

  input.addEventListener('input', update);

  document.querySelectorAll('.copy-btn[data-copy-target]').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      var el = document.getElementById(btn.dataset.copyTarget);
      var text = el.textContent;
      if (!text || text === '--') { showToast('暂无结果可复制'); return; }
      showToast(await window.copyText(text) ? '已复制' : '复制失败');
    });
  });
})();
