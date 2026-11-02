// 大小写转换核心算法（浏览器与单元测试共用，无任何依赖）

/** 按空格 / - / _ 切词 */
function splitWords(str) {
  return str.split(/[\s\-_]+/).filter((w) => w.length > 0);
}

function swapCase(ch) {
  const up = ch.toUpperCase();
  return ch === up ? ch.toLowerCase() : up;
}

export function toUpper(s) {
  return s.toUpperCase();
}

export function toLower(s) {
  return s.toLowerCase();
}

/** 每个单词首字母大写、其余小写（中文等无大小写字符保留原样） */
export function toTitleCase(s) {
  return s.replace(/[A-Za-z][A-Za-z']*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

/** 仅每句首字母大写（以 . ! ? 和换行分句），其余字母小写 */
export function toSentenceCase(s) {
  let out = '';
  let newSentence = true;
  for (const ch of s) {
    if (newSentence && /[a-z]/i.test(ch)) {
      out += ch.toUpperCase();
      newSentence = false;
    } else {
      out += ch.toLowerCase();
    }
    if ('.!?'.includes(ch) || ch === '\n') newSentence = true;
  }
  return out;
}

/** 逐字符 swapcase */
export function toSwapCase(s) {
  return [...s].map(swapCase).join('');
}

/**
 * 驼峰命名：按空格 / - / _ 切词，去掉分隔符。
 * 小驼峰：首词全小写，后续词首字母大写。
 */
export function toCamelCase(s) {
  const words = splitWords(s);
  if (words.length === 0) return '';
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((w) => {
        const lower = w.toLowerCase();
        return lower[0].toUpperCase() + lower.slice(1);
      })
      .join('')
  );
}

export const MODES = {
  upper: { label: '全部大写', fn: toUpper },
  lower: { label: '全部小写', fn: toLower },
  title: { label: '单词首字母大写', fn: toTitleCase },
  sentence: { label: '句首字母大写', fn: toSentenceCase },
  swap: { label: '大小写反转', fn: toSwapCase },
  camel: { label: '驼峰命名', fn: toCamelCase },
};

export function convert(s, mode) {
  const m = MODES[mode];
  if (!m) throw new Error(`未知模式: ${mode}`);
  return m.fn(s);
}
