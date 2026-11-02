// 纯 JS MD5（RFC 1321），浏览器与单元测试共用。
// 轮常量 T[i] = floor(|sin(i+1)| * 2^32) 按定义现算，避免手抄出错；UTF-8 编码输入。

const T = new Int32Array(64);
for (let i = 0; i < 64; i++) T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

function add(a, b) { return (a + b) | 0; }
function rol(x, c) { return (x << c) | (x >>> (32 - c)); }

function ff(a, b, c, d, x, s, t) { return add(rol(add(add(a, (b & c) | (~b & d)), add(x, t)), s), b); }
function gg(a, b, c, d, x, s, t) { return add(rol(add(add(a, (b & d) | (c & ~d)), add(x, t)), s), b); }
function hh(a, b, c, d, x, s, t) { return add(rol(add(add(a, b ^ c ^ d), add(x, t)), s), b); }
function ii(a, b, c, d, x, s, t) { return add(rol(add(add(a, c ^ (b | ~d)), add(x, t)), s), b); }

function md5Bytes(bytes) {
  const len = bytes.length;
  // 填充：0x80 + 0x00 至 ≡ 56 (mod 64)，再补 64 位小端比特长度
  const padded = new Uint8Array((((len + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const bitLen = len * 8;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bitLen >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 4294967296), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  const w = new Int32Array(16);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let g;
      if (i < 16) { g = i; A = ff(A, B, C, D, w[g], S[i], T[i]); }
      else if (i < 32) { g = (5 * i + 1) % 16; A = gg(A, B, C, D, w[g], S[i], T[i]); }
      else if (i < 48) { g = (3 * i + 5) % 16; A = hh(A, B, C, D, w[g], S[i], T[i]); }
      else { g = (7 * i) % 16; A = ii(A, B, C, D, w[g], S[i], T[i]); }
      const oldD = D;
      D = C; C = B; B = A; A = oldD; // 轮转 (A,B,C,D) → (D,新A,B,C)
    }
    a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
  }

  // 小端十六进制输出
  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setInt32(0, a0, true); odv.setInt32(4, b0, true); odv.setInt32(8, c0, true); odv.setInt32(12, d0, true);
  let hex = '';
  for (const b of out) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/** 计算字符串（UTF-8）的 32 位小写 MD5 */
export function md5(str) {
  return md5Bytes(new TextEncoder().encode(str));
}

/** 16 位 MD5 = 32 位串的第 9~24 位（[8:24] 截取） */
export function md5Short(str) {
  return md5(str).slice(8, 24);
}
