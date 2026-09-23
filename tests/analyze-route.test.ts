import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { emptyCard } from "@/domain/task";
import { resetAnalyzeRateLimitForTests } from "@/server/ai";

afterEach(() => {
  vi.unstubAllEnvs();
  resetAnalyzeRateLimitForTests();
});

describe("preliminary task rating", () => {
  it("does not count source text as a confirmed card field", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("AI_MODE", "local");
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description: "Сеть кафе каждый вечер списывает непроданную выпечку",
          card: emptyCard,
        }),
      }),
    );
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.preliminaryReadiness.score).toBe(0);
    expect(
      result.preliminaryReadiness.breakdown.find(
        (row: { field: string }) => row.field === "context",
      ).complete,
    ).toBe(false);
  });
});
