import { z } from "zod";
import { cardSchema } from "@/domain/task";
import { assessTaskQuality, consumeAnalyzeRateLimit } from "@/server/ai";
import { readLimitedBody } from "@/server/http";
import { issueReviewTicket } from "@/server/review-tickets";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = consumeAnalyzeRateLimit("review-task");
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
    const input = z
      .object({
        rawDescription: z.string().trim().min(10).max(4000),
        card: cardSchema,
      })
      .parse(JSON.parse(body));
    const assessment = await assessTaskQuality(
      input.rawDescription,
      input.card,
    );
    return Response.json({
      assessment,
      reviewToken: issueReviewTicket(
        input.rawDescription,
        input.card,
        assessment,
      ),
    });
  } catch {
    return Response.json(
      {
        error:
          "Не удалось оценить карточку. Проверьте описание и попробуйте снова",
      },
      { status: 422 },
    );
  }
}
