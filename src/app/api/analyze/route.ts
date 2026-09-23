import { z } from "zod";
import { cardSchema } from "@/domain/task";
import { analyze } from "@/server/ai";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 65000)
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
    return Response.json(await analyze(input.description, input.card));
  } catch {
    return Response.json(
      { error: "Проверьте описание и поля карточки" },
      { status: 422 },
    );
  }
}
