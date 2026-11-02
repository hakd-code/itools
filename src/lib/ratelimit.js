// 简单滑动窗口限流（内存实现），按 IP 限流
const buckets = new Map(); // key -> { count, resetAt }

// 定期清理过期桶，防止内存膨胀
const CLEAN_INTERVAL = 5 * 60 * 1000;
let cleaner = null;

export function rateLimit({ windowMs = 60_000, max = 60 } = {}) {
  if (!cleaner) {
    cleaner = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
    }, CLEAN_INTERVAL);
    cleaner.unref?.();
  }

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }
    bucket.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: `请求过于频繁，请 ${retryAfter} 秒后再试` });
    }
    next();
  };
}

/** 测试用：清空所有限流计数 */
export function resetRateLimits() {
  buckets.clear();
}
