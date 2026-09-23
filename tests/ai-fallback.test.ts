import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyze, localAnalysis } from "@/server/ai";
import { emptyCard } from "@/domain/task";
import { seedTasks } from "@/domain/demo-data";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    responses = { create };
  },
}));
beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "test-key-not-real");
  vi.stubEnv("AI_MODE", "auto");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe("AI failure recovery", () => {
  it("uses local questions without an API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect((await analyze("Потребность кофейни", emptyCard)).mode).toBe(
      "local",
    );
    expect(create).not.toHaveBeenCalled();
  });
  it.each(["", "not json", '{"questions":[]}'])(
    "falls back from an unusable response: %s",
    async (output_text) => {
      create.mockResolvedValue({ output_text });
      const card = { ...emptyCard, need: "Мой ответ" };
      const before = { ...card };
      const result = await analyze("Потребность кофейни", card);
      expect(result.mode).toBe("local");
      expect(result.questions.length).toBeGreaterThanOrEqual(3);
      expect(result.suggestions).toEqual({});
      expect(card).toEqual(before);
    },
  );
  it("falls back after an API error or timeout", async () => {
    create.mockRejectedValue(new Error("Request timed out"));
    expect((await analyze("Потребность кофейни", emptyCard)).mode).toBe(
      "local",
    );
  });
  it("asks for refinements when the card is already complete", () => {
    const result = localAnalysis(seedTasks[0].card.context, seedTasks[0].card);
    expect(result.questions.length).toBeGreaterThanOrEqual(3);
    expect(
      result.questions.every((question) =>
        question.question.startsWith("Уточните:"),
      ),
    ).toBe(true);
  });
});
