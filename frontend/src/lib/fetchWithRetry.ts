/** Fetch with timeout + one retry — helps when Render free tier is cold-starting. */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? 45_000;
  const retries = opts.retries ?? 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
        headers: init.headers,
      });
      // Retry once on transient platform errors (Render spin-up / overload)
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new Error('The server is taking too long to respond. Please try again in a moment.');
  }
  throw lastError instanceof Error ? lastError : new Error('Network request failed.');
}
