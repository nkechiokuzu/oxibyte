type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically clear stale buckets so this Map doesn't grow forever.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  },
  10 * 60 * 1000,
).unref();

/**
 * Returns true if the action is allowed (and records it), false if the
 * caller has exceeded `limit` attempts within `windowMs`.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
