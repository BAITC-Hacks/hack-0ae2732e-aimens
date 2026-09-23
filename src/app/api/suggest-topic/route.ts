import { z } from "zod";
import { consumeAnalyzeRateLimit, suggestTopic } from "@/server/ai";
import { readLimitedBody } from "@/server/http";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = consumeAnalyzeRateLimit("suggest-topic");
  if (!limit.allowed)
    return Response.json(
      { error: "Слишком много запросов к AI. Попробуйте позже" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  try {
    const body = await readLimitedBody(request);
    if (body === null)
      return Response.json(
        { error: "Слишком большой запрос" },
        { status: 413 },
      );
    const { description } = z
      .object({ description: z.string().trim().min(8).max(4000) })
      .parse(JSON.parse(body));
    return Response.json(await suggestTopic(description));
  } catch {
    return Response.json(
      {
        error: "Добавьте несколько слов о задаче, чтобы подобрать направление",
      },
      { status: 422 },
    );
  }
}
