export const REQUEST_BODY_LIMIT_BYTES = 65_000;

/**
 * Reads a request body without buffering more than the configured byte limit.
 * A null result means the body is too large.
 */
export async function readLimitedBody(
  request: Request,
  limit = REQUEST_BODY_LIMIT_BYTES,
) {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > limit) {
      await request.body
        ?.cancel("Request body exceeds the limit")
        .catch(() => {});
      return null;
    }
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > limit) {
        await reader.cancel("Request body exceeds the limit").catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
