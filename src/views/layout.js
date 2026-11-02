// 公共视图工具：HTML 转义 + 页面骨架（顶栏/页脚/主题）
import { NAV_LINKS, FOOTER_TEXT, FOOTER_COPYRIGHT } from '../site-config.js';

export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function layout({ title, description = 'iTools —— 轻量在线工具箱：密码生成、汇率换算、UUID、MD5、大小写转换、文本对比', content, bodyClass = '', scripts = [] }) {
  const scriptTags = scripts.map((src) => `<script type="module" src="${esc(src)}"></script>`).join('\n  ');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} · iTools 在线工具箱</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/app.css?v=1.0.1">
  <script>document.documentElement.dataset.theme = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');</script>
</head>
<body class="${esc(bodyClass)}">
  <header class="topbar">
    <div class="topbar-inner container">
      <a class="brand" href="/">
        <svg class="brand-logo" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2" fill="var(--primary)"/><rect x="13" y="3" width="8" height="8" rx="2" fill="var(--primary)" opacity=".45"/><rect x="3" y="13" width="8" height="8" rx="2" fill="var(--primary)" opacity=".45"/><rect x="13" y="13" width="8" height="8" rx="2" fill="var(--primary)"/></svg>
        <span>iTools</span>
      </a>
      <nav class="topnav">${NAV_LINKS.map((n) => `<a class="nav-link${n.url === '/' ? '' : ''}" href="${esc(n.url)}">${esc(n.label)}</a>`).join('')}</nav>
      <button class="theme-toggle" id="themeToggle" type="button" title="切换深色 / 浅色模式" aria-label="切换主题">
        <svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19"/></g></svg>
        <svg class="icon-moon" viewBox="0 0 24 24"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" fill="currentColor"/></svg>
      </button>
    </div>
  </header>
  <main class="container main-content">
${content}
  </main>
  <footer class="footer">
    <div class="container">
      <p>${esc(FOOTER_TEXT)}</p>
      <p class="footer-copy">${esc(FOOTER_COPYRIGHT.replace('{year}', String(new Date().getFullYear())))}</p>
    </div>
  </footer>
  <div class="toast" id="toast" role="status"></div>
  <script src="/js/common.js"></script>
  ${scriptTags}
</body>
</html>`;
}

/** 面包屑（工具页顶部） */
export function breadcrumb(toolName) {
  return `<nav class="breadcrumb" aria-label="面包屑">
  <a href="/">全部工具</a><span class="crumb-sep">/</span><span class="crumb-current">${esc(toolName)}</span>
</nav>`;
}

/** 顶部返回按钮行 */
export function toolHeader(toolName) {
  return `${breadcrumb(toolName)}
  <h1 class="tool-title">${esc(toolName)}</h1>`;
}
