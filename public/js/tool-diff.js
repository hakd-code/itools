// 工具：文本对比（行级 + 字符级，双视图，超 5000 行转后台计算）
import { diffLines, diffChars, alignRows, diffStats } from './diff-core.mjs';

(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var oldText = $('oldText'), newText = $('newText');
  var view = $('diffView'), stats = $('diffStats');
  var statAdd = $('statAdd'), statDel = $('statDel'), status = $('diffStatus');
  var ignoreCase = $('diffIgnoreCase'), onlyChanges = $('diffOnlyChanges');
  var viewMode = 'split';
  var lastScript = null;

  function esc(s) {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  // 行内字符级高亮：仅对内容不同的成对行做 diffChars
  function inlineHtml(oldStr, newStr) {
    var parts = diffChars(oldStr, newStr);
    var oldHtml = '', newHtml = '';
    parts.forEach(function (p) {
      if (p.type === 'same') {
        oldHtml += esc(p.text);
        newHtml += esc(p.text);
      } else {
        oldHtml += '<span class="del">' + esc(p.text) + '</span>';
        newHtml += '<span class="ins">' + esc(p.text) + '</span>';
      }
    });
    return { oldHtml: oldHtml, newHtml: newHtml };
  }

  function run() {
    var a = oldText.value, b = newText.value;
    if (a === '' && b === '') { view.hidden = true; stats.hidden = true; return; }
    var total = a.split('\n').length + b.split('\n').length;
    status.textContent = '';
    if (total > 10000) {
      // 大文本：先提示，再让出主线程计算（避免卡 UI）
      status.textContent = '大文本，计算中…';
      view.hidden = true;
      setTimeout(function () {
        try {
          render(diffLines(a, b, { ignoreCase: ignoreCase.checked }));
          status.textContent = '';
        } catch (e) {
          status.textContent = '计算失败: ' + e.message;
        }
      }, 60);
      return;
    }
    render(diffLines(a, b, { ignoreCase: ignoreCase.checked }));
  }

  function render(script) {
    lastScript = script;
    var s = diffStats(script);
    statAdd.textContent = '新增 ' + s.added + ' 行';
    statDel.textContent = '删除 ' + s.removed + ' 行';
    stats.hidden = false;
    view.hidden = false;
    if (viewMode === 'split') renderSplit(script);
    else renderUnified(script);
  }

  function renderSplit(script) {
    var rows = alignRows(script);
    var html = '<table class="diff-table"><colgroup><col style="width:46px"><col><col style="width:46px"><col></colgroup><tbody>';
    rows.forEach(function (r) {
      if (r.type === 'same' && onlyChanges.checked) return;
      var cls = r.type === 'same' ? 'row-same' : r.type === 'pair' ? 'row-pair' : r.type === 'del' ? 'row-del' : 'row-add';
      html += '<tr class="' + cls + '">';
      if (r.type === 'add') {
        // 一侧增删时另一侧用等高空行占位，保证行号严格对齐
        html += '<td class="diff-no"></td><td class="diff-code side-old"></td>';
      } else {
        var oldCell = esc(r.oldText);
        if (r.type === 'pair' && r.oldText && r.newText) oldCell = inlineHtml(r.oldText, r.newText).oldHtml;
        html += '<td class="diff-no">' + (r.oldNo ?? '') + '</td><td class="diff-code side-old">' + oldCell + '</td>';
      }
      if (r.type === 'del') {
        html += '<td class="diff-no"></td><td class="diff-code side-new"></td>';
      } else {
        var newCell = esc(r.newText);
        if (r.type === 'pair' && r.oldText && r.newText) newCell = inlineHtml(r.oldText, r.newText).newHtml;
        html += '<td class="diff-no">' + (r.newNo ?? '') + '</td><td class="diff-code side-new">' + newCell + '</td>';
      }
      html += '</tr>';
    });
    view.innerHTML = html + '</tbody></table>';
  }

  function renderUnified(script) {
    // 经典 patch 样式：- 行红、+ 行绿、上下文行原样，单列展示
    var html = '<table class="diff-table"><colgroup><col style="width:46px"><col style="width:46px"><col></colgroup><tbody>';
    var oldNo = 1, newNo = 1;
    script.forEach(function (item) {
      if (item.type === 'same') {
        if (onlyChanges.checked) return;
        html += '<tr class="row-same"><td class="diff-no">' + oldNo + '</td><td class="diff-no">' + newNo + '</td><td class="diff-code">' + esc(item.a) + '</td></tr>';
        oldNo++; newNo++;
      } else if (item.type === 'del') {
        html += '<tr class="row-del"><td class="diff-no">' + oldNo + '</td><td class="diff-no"></td><td class="diff-code"><span class="diff-line-sign">-</span>' + esc(item.a) + '</td></tr>';
        oldNo++;
      } else {
        html += '<tr class="row-add"><td class="diff-no"></td><td class="diff-no">' + newNo + '</td><td class="diff-code"><span class="diff-line-sign">+</span>' + esc(item.b) + '</td></tr>';
        newNo++;
      }
    });
    view.innerHTML = html + '</tbody></table>';
  }

  $('diffRunBtn').addEventListener('click', run);
  $('diffClearBtn').addEventListener('click', function () {
    oldText.value = ''; newText.value = '';
    view.hidden = true; stats.hidden = true;
  });
  ignoreCase.addEventListener('change', run);
  onlyChanges.addEventListener('change', function () {
    if (lastScript && !view.hidden) {
      if (viewMode === 'split') renderSplit(lastScript);
      else renderUnified(lastScript);
    }
  });
  document.querySelectorAll('.seg-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.seg-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      viewMode = btn.dataset.view;
      if (lastScript && !view.hidden) {
        if (viewMode === 'split') renderSplit(lastScript);
        else renderUnified(lastScript);
      }
    });
  });
})();
