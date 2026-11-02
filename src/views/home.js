// 首页：搜索框 + 分类分区卡片网格
import { layout, esc } from './layout.js';
import { CATEGORIES, TOOLS, toolCard } from './tools-registry.js';

export function homePage() {
  const sections = CATEGORIES.map((cat) => {
    const tools = TOOLS.filter((t) => t.category === cat.key);
    return `<section class="tool-section" data-category="${cat.key}">
      <h2 class="section-title">${esc(cat.name)}</h2>
      <div class="tool-grid">
        ${tools.map(toolCard).join('\n        ')}
      </div>
    </section>`;
  }).join('\n');

  const content = `
  <section class="hero">
    <h1>在线工具箱</h1>
    <p>轻量 · 清爽 · 本地优先 —— 共 ${TOOLS.length} 个工具</p>
    <div class="search-wrap">
      <svg viewBox="0 0 24 24" class="search-icon" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16.5 16.5 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
      <input type="search" id="toolSearch" class="input search-input" placeholder="搜索工具，如：密码、MD5、diff…" autocomplete="off" aria-label="搜索工具">
    </div>
  </section>
  <p class="search-empty" id="searchEmpty" hidden>没有找到匹配的工具，换个关键词试试</p>
  ${sections}`;

  return layout({
    title: '首页',
    content,
    scripts: ['/js/home.js'],
  });
}
