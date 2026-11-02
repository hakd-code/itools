// 工具注册表：首页卡片与路由共用
import { esc } from './layout.js';

export const CATEGORIES = [
  { key: 'dev', name: '开发运维' },
  { key: 'text', name: '文本处理' },
  { key: 'rand', name: '选择随机' },
];

export const TOOLS = [
  {
    slug: 'password', name: '随机密码生成', category: 'rand',
    desc: '服务端强随机生成，保证字符类覆盖，支持自定义符号集',
    badge: '服务端生成',
    icon: '<path d="M14 6a5 5 0 0 0-9.6 2H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-.9A3 3 0 0 1 14 6z" opacity=".9"/><circle cx="6" cy="14" r="1.4"/><circle cx="9" cy="14" r="1.4"/><circle cx="7.5" cy="16.8" r="1.4"/>',
  },
  {
    slug: 'exchange', name: '汇率换算', category: 'dev',
    desc: '13 种常用币种互转，汇率每 6 小时联网更新',
    badge: '联网数据',
    icon: '<path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    slug: 'uuid', name: 'UUID 生成', category: 'dev',
    desc: '批量生成 UUID v4，支持大写、去连字符',
    badge: '本地处理',
    icon: '<rect x="3" y="8" width="18" height="9" rx="2" fill="none" stroke-width="2"/><path d="M7 12.5h.01M11 12.5h.01M15 12.5h.01M17.5 12.5h.01" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
  },
  {
    slug: 'md5', name: 'MD5 加密', category: 'dev',
    desc: '输入即得 32/16 位大小写四种结果，纯前端计算',
    badge: '本地处理',
    icon: '<path d="M4 4h16v4H4zM4 10h7v4H4zM4 16h16v4H4z" opacity=".9"/><path d="M14 10h6M14 12h4" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  },
  {
    slug: 'case', name: '大小写转换', category: 'text',
    desc: '六种模式一键转换：大小写、句首、驼峰命名等',
    badge: '本地处理',
    icon: '<path d="M3 18 7.5 6l4.5 12M4.6 14h5.8" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.5 11.5c-3 0-4 1-4 3.5s1 3 3 3c1.5 0 2.5-1 2.5-1M21 18v-3c0-2.5-.8-3.5-3-3.5" fill="none" stroke-width="2" stroke-linecap="round"/>',
  },
  {
    slug: 'diff', name: '文本对比', category: 'text',
    desc: '左右分栏逐行对比，行内字符级高亮，支持统一视图',
    badge: '本地处理',
    icon: '<rect x="3" y="4" width="7.5" height="16" rx="1.5" fill="none" stroke-width="2"/><rect x="13.5" y="4" width="7.5" height="16" rx="1.5" fill="none" stroke-width="2"/><path d="M5.5 9h3M5.5 12h3M15.5 9h3" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
  },
];

export function toolCard(tool) {
  return `<a class="tool-card" href="/tools/${tool.slug}/" data-name="${esc(tool.name)}" data-desc="${esc(tool.desc)}" data-slug="${tool.slug}">
    <span class="tool-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">${tool.icon}</svg></span>
    <span class="tool-body">
      <span class="tool-name">${esc(tool.name)}</span>
      <span class="tool-desc">${esc(tool.desc)}</span>
    </span>
    <span class="tool-badge">${esc(tool.badge)}</span>
  </a>`;
}
