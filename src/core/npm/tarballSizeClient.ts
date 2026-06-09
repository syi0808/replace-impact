type ClientOptions = {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
};

const maxFallbackGetBytes = 2_000_000;

export async function fetchTarballBytes(
  tarballUrl: string | undefined,
  options: ClientOptions = {}
): Promise<number | null> {
  if (!tarballUrl) {
    return null;
  }

  const fetcher = options.fetchImpl ?? fetch;

  try {
    const head = await fetcher(tarballUrl, {
      method: "HEAD",
      signal: options.signal
    });
    const length = parseContentLength(head.headers.get("content-length"));
    if (head.ok && length !== null) {
      return length;
    }
  } catch {
    // Normal browser CORS and registry behavior can block HEAD; fall through to a guarded GET.
  }

  try {
    const response = await fetcher(tarballUrl, {
      method: "GET",
      signal: options.signal
    });
    const length = parseContentLength(response.headers.get("content-length"));
    if (!response.ok || length === null || length > maxFallbackGetBytes) {
      return null;
    }

    const bytes = await response.arrayBuffer();
    return bytes.byteLength;
  } catch {
    return null;
  }
}

function parseContentLength(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
