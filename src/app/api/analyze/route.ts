import { z } from "zod";
import { cardSchema, computeReadiness } from "@/domain/task";
import { analyze, consumeAnalyzeRateLimit } from "@/server/ai";
import { readLimitedBody } from "@/server/http";
export const runtime = "nodejs";

function requestClientId(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    forwarded?.trim().slice(0, 80) ||
    request.headers.get("x-real-ip")?.trim().slice(0, 80) ||
    "local-client"
  );
}

export async function POST(request: Request) {
  const rateLimit = consumeAnalyzeRateLimit(requestClientId(request));
  if (!rateLimit.allowed)
    return Response.json(
      { error: "Слишком много запросов к AI. Попробуйте немного позже" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );

  try {
    const text = await readLimitedBody(request);
    if (text === null)
      return Response.json(
        { error: "Слишком длинное описание" },
        { status: 413 },
      );
    const input = z
      .object({
        description: z
          .string()
          .trim()
          .min(10, "Расскажите о задаче чуть подробнее — от 10 символов")
          .max(4000),
        card: cardSchema,
      })
      .parse(JSON.parse(text));
    const analysis = await analyze(input.description, input.card);
    return Response.json({
      ...analysis,
      preliminaryReadiness: computeReadiness(input.card),
    });
  } catch {
    return Response.json(
      { error: "Проверьте описание и поля карточки" },
      { status: 422 },
    );
  }
}
