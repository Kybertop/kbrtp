export class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

export class TimeoutError extends Error {
  constructor() {
    super("timeout");
  }
}

type Options = {
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
};

export async function fetchJson<T>(url: string, options: Options = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 12000;
  const retries = options.retries ?? 1;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" }
    });
    if (response.status === 429) throw new HttpError(429);
    if (!response.ok) throw new HttpError(response.status);
    return (await response.json()) as T;
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    if (aborted) {
      if (options.signal?.aborted) throw error;
      throw new TimeoutError();
    }
    const retryable = error instanceof HttpError && (error.status === 429 || error.status >= 500);
    if (retries > 0 && (retryable || error instanceof TypeError)) {
      return fetchJson<T>(url, { ...options, retries: retries - 1 });
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}
