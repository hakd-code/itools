// 首页：按名称/关键词过滤工具卡片
(function () {
  'use strict';
  var input = document.getElementById('toolSearch');
  if (!input) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll('.tool-card'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('.tool-section'));
  var empty = document.getElementById('searchEmpty');

  function normalize(s) {
    return (s || '').toLowerCase().replace(/\s+/g, '');
  }

  function filter() {
    var q = normalize(input.value);
    var any = false;
    cards.forEach(function (card) {
      var hay = normalize(card.dataset.name + card.dataset.desc + card.dataset.slug);
      var hit = !q || hay.indexOf(q) !== -1;
      card.hidden = !hit;
      if (hit) any = true;
    });
    sections.forEach(function (sec) {
      var visible = sec.querySelectorAll('.tool-card:not([hidden])').length > 0;
      sec.hidden = !visible;
    });
    empty.hidden = any || !q;
  }

  input.addEventListener('input', filter);
  // 支持 /#q=密码 直达搜索
  if (location.hash.length > 2) {
    input.value = decodeURIComponent(location.hash.slice(1));
    filter();
  }
})();
