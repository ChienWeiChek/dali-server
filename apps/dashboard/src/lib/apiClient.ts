// Default fetch timeout: 75 s. Long-range energy queries (monthly, 365 d) can
// take 30–60 s on large datasets; the InfluxDB socket is set to 60 s, so 75 s
// gives the server room to return its own error before the browser times out.
const DEFAULT_TIMEOUT_MS = 75_000;

export async function apiFetch(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
  };

  const finalUrl = endpoint.startsWith("http")
    ? endpoint
    : `${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

  // Merge any caller-supplied signal with the timeout signal so both can abort.
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(new DOMException(`Request timed out after ${timeoutMs} ms`, "TimeoutError")),
    timeoutMs,
  );

  const signal =
    fetchOptions.signal
      ? anySignal([fetchOptions.signal, timeoutController.signal])
      : timeoutController.signal;

  try {
    const response = await fetch(finalUrl, { ...fetchOptions, headers, signal });

    // // Handle token expiration or invalid credentials globally
    // if (response.status === 401) {
    //   if (typeof window !== 'undefined') {
    //     localStorage.clear();
    //     window.location.href = '/login';
    //   }
    //   throw new Error('Unauthorized. Please log in again.');
    // }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Combine multiple AbortSignals — aborts as soon as any one fires. */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort(sig.reason);
      break;
    }
    sig.addEventListener("abort", () => controller.abort(sig.reason), { once: true });
  }
  return controller.signal;
}
