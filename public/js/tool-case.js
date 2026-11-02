// 工具：大小写转换（六模式，点即切换）
import { convert } from './case-core.mjs';

(function () {
  'use strict';
  var input = document.getElementById('caseInput');
  var resultBox = document.getElementById('caseResult');
  var charCount = document.getElementById('charCount');
  var copyBtn = document.getElementById('caseCopyBtn');
  var currentResult = '';

  document.querySelectorAll('.btn-mode').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.btn-mode').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var mode = btn.dataset.mode;
      try {
        currentResult = convert(input.value, mode);
        resultBox.textContent = currentResult || '（无内容）';
        charCount.hidden = false;
        charCount.textContent = currentResult.length + ' 字符';
        copyBtn.hidden = false;
      } catch (e) {
        resultBox.textContent = '转换出错: ' + e.message;
      }
    });
  });

  copyBtn.addEventListener('click', async function () {
    if (!currentResult) return;
    showToast(await window.copyText(currentResult) ? '已复制结果' : '复制失败');
  });
})();
