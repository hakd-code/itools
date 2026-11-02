// Myers O(ND) 差异算法（经典 trace 回溯实现，内存有界），浏览器与单元测试共用。
// 返回编辑脚本：[{ type: 'same'|'del'|'add', a?, b?, aIndex?, bIndex? }]
// same 项同时携带 a/b；del 只携带 a 侧；add 只携带 b 侧。

// 单个子问题允许的最大编辑距离（快照内存 O(D²)，D=2000 约 16MB 上限）。
// 超过时退化为"整块替换"（结果仍正确，仅不再细化）。
const MAX_D = 2000;

/**
 * 主入口：a、b 为数组，eq 为相等判断函数。
 * 输出按序列顺序排列的编辑脚本。
 */
export function diffArrays(a, b, eq = (x, y) => x === y) {
  const out = [];
  let a0 = 0, a1 = a.length, b0 = 0, b1 = b.length;

  // 公共前缀
  while (a0 < a1 && b0 < b1 && eq(a[a0], b[b0])) {
    out.push({ type: 'same', a: a[a0], b: b[b0], aIndex: a0, bIndex: b0 });
    a0++; b0++;
  }
  // 公共后缀（先收集，最后按正序输出）
  const suffix = [];
  while (a1 > a0 && b1 > b0 && eq(a[a1 - 1], b[b1 - 1])) {
    a1--; b1--;
    suffix.push({ type: 'same', a: a[a1], b: b[b1], aIndex: a1, bIndex: b1 });
  }

  if (a0 === a1) {
    for (let j = b0; j < b1; j++) out.push({ type: 'add', b: b[j], bIndex: j });
  } else if (b0 === b1) {
    for (let i = a0; i < a1; i++) out.push({ type: 'del', a: a[i], aIndex: i });
  } else {
    myersMiddle(a, a0, a1, b, b0, b1, eq, out);
  }

  for (let i = suffix.length - 1; i >= 0; i--) out.push(suffix[i]);
  return out;
}

/** 对非空中间区段求编辑脚本（Myers 贪心 + trace 回溯），结果追加到 out */
function myersMiddle(a, a0, a1, b, b0, b1, eq, out) {
  const N = a1 - a0, M = b1 - b0;
  const maxD = N + M;
  const offset = maxD + 1;
  const v = new Int32Array(2 * offset + 1); // k ∈ [-maxD, maxD] → 下标 offset + k
  const trace = []; // 每步 { lo, data }：data[i] 对应对角线 lo + i
  let D = -1;

  outer:
  for (let d = 0; d <= maxD; d++) {
    trace.push({ lo: -(d - 1), data: d === 0 ? null : v.slice(offset - (d - 1), offset + d) });
    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1];        // 自对角线 k+1 向下移动一步（插入 b 行）
      } else {
        x = v[offset + k - 1] + 1;    // 自对角线 k-1 向右移动一步（删除 a 行）
      }
      let y = x - k;
      while (x < N && y < M && eq(a[a0 + x], b[b0 + y])) { x++; y++; } // 贪心延伸蛇
      v[offset + k] = x;
      if (x >= N && y >= M) { D = d; break outer; }
    }
    if (d >= MAX_D) break outer; // 超出预算，走整块替换兜底
  }

  if (D === -1) {
    // 兜底：整块替换
    for (let i = a0; i < a1; i++) out.push({ type: 'del', a: a[i], aIndex: i });
    for (let j = b0; j < b1; j++) out.push({ type: 'add', b: b[j], bIndex: j });
    return;
  }

  // 回溯：items 收集顺序为倒序（后步骤在前），最后整体反转
  const items = [];
  let x = N, y = M; // 终点
  for (let d = D; d >= 1; d--) {
    const snap = trace[d]; // 状态 = 完成 d-1 步后
    const k = x - y;
    let prevK;
    if (k === -d) prevK = k + 1;
    else if (k === d) prevK = k - 1;
    else prevK = snap.data[(k - 1) - snap.lo] < snap.data[(k + 1) - snap.lo] ? k + 1 : k - 1;
    const prevX = snap.data[prevK - snap.lo];
    const prevY = prevX - prevK;

    // 蛇段：从到达点延伸到当前点 (x, y)，在对角线 k 上。
    // 回溯阶段按倒序入栈（全局反转后恰为正序）
    const arrX = prevK === k + 1 ? prevX : prevX + 1; // 到达点（移动一步之后）
    for (let t = x - 1; t >= arrX; t--) {
      items.push({ type: 'same', a: a[a0 + t], b: b[b0 + (t - k)], aIndex: a0 + t, bIndex: b0 + (t - k) });
    }
    if (prevK === k + 1) {
      items.push({ type: 'add', b: b[b0 + prevY], bIndex: b0 + prevY }); // 向下移动 = 插入 b
    } else {
      items.push({ type: 'del', a: a[a0 + prevX], aIndex: a0 + prevX }); // 向右移动 = 删除 a
    }
    x = prevX; y = prevY;
  }
  // d=0 的初始蛇段（子问题内的公共前缀）
  for (let t = 0; t < x; t++) {
    items.push({ type: 'same', a: a[a0 + t], b: b[b0 + t], aIndex: a0 + t, bIndex: b0 + t });
  }
  for (let i = items.length - 1; i >= 0; i--) out.push(items[i]);
}

/** 文本行差异：输入两段文本，输出按行对齐的编辑脚本 */
export function diffLines(oldText, newText, { ignoreCase = false } = {}) {
  const a = oldText.length ? oldText.split('\n') : [];
  const b = newText.length ? newText.split('\n') : [];
  const eq = ignoreCase
    ? (p, q) => p.toLowerCase() === q.toLowerCase()
    : undefined;
  return diffArrays(a, b, eq);
}

/** 字符级差异（用于行内高亮），返回 [{ type, text }]，相邻同类合并 */
export function diffChars(oldStr, newStr) {
  const script = diffArrays([...oldStr], [...newStr]);
  const merged = [];
  for (const item of script) {
    const text = item.a ?? item.b;
    const last = merged[merged.length - 1];
    if (last && last.type === item.type) last.text += text;
    else merged.push({ type: item.type, text });
  }
  return merged;
}

/**
 * 并排视图行模型：将行级脚本重组为左右成对的行数组。
 * 返回 [{ type: 'same'|'pair'|'del'|'add', oldNo, newNo, oldText, newText }]
 * pair 表示左右都有内容但内容不同（可做行内字符级高亮）。
 */
export function alignRows(script) {
  const rows = [];
  let oldNo = 1, newNo = 1;
  let i = 0;
  while (i < script.length) {
    if (script[i].type === 'same') {
      rows.push({ type: 'same', oldNo: oldNo++, newNo: newNo++, oldText: script[i].a, newText: script[i].b });
      i++;
      continue;
    }
    const dels = [], adds = [];
    while (i < script.length && script[i].type === 'del') { dels.push(script[i].a); i++; }
    while (i < script.length && script[i].type === 'add') { adds.push(script[i].b); i++; }
    const n = Math.max(dels.length, adds.length);
    for (let j = 0; j < n; j++) {
      const hasDel = j < dels.length, hasAdd = j < adds.length;
      rows.push({
        type: hasDel && hasAdd ? 'pair' : hasDel ? 'del' : 'add',
        oldNo: hasDel ? oldNo++ : null,
        newNo: hasAdd ? newNo++ : null,
        oldText: hasDel ? dels[j] : '',
        newText: hasAdd ? adds[j] : '',
      });
    }
  }
  return rows;
}

/** 统计：新增行数 / 删除行数 */
export function diffStats(script) {
  let added = 0, removed = 0;
  for (const item of script) {
    if (item.type === 'add') added++;
    else if (item.type === 'del') removed++;
  }
  return { added, removed };
}
