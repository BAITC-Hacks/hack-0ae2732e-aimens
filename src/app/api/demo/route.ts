import { ZodError } from "zod";
import { DemoError, getStore } from "@/server/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      { error: error.issues[0]?.message || "Проверьте поля формы" },
      { status: 422 },
    );
  if (error instanceof DemoError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError)
    return Response.json({ error: "Неверный формат запроса" }, { status: 400 });
  console.error(
    "Demo operation failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    { error: "Не удалось сохранить изменения. Попробуйте ещё раз." },
    { status: 500 },
  );
}
export async function GET(request: Request) {
  try {
    return Response.json(
      getStore().snapshot(request.headers.get("x-demo-actor") || "business"),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 65000)
      return Response.json(
        { error: "Слишком большой запрос" },
        { status: 413 },
      );
    return Response.json(
      getStore().act(
        request.headers.get("x-demo-actor") || "business",
        JSON.parse(body),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
