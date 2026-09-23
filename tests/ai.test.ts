import { describe, expect, it } from "vitest";
import { localAnalysis, validateAnalysis } from "@/server/ai";
import { emptyCard } from "@/domain/task";
describe("AI assistance", () => {
  it("has at least three useful questions without a key", () => {
    const result = localAnalysis("Кофейня списывает выпечку", emptyCard);
    expect(result.mode).toBe("local");
    expect(result.questions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions).toEqual({});
  });
  it("rejects inventions even with a valid-looking source", () => {
    const questions = localAnalysis(
      "Кофейня списывает выпечку",
      emptyCard,
    ).questions;
    const result = validateAnalysis(
      {
        extractions: [
          {
            field: "context",
            value: "Кофейня списывает выпечку",
            sourceQuote: "Кофейня списывает выпечку",
          },
          {
            field: "successTarget",
            value: "Снижение на 50%",
            sourceQuote: "Кофейня списывает выпечку",
          },
        ],
        questions,
      },
      "Кофейня списывает выпечку",
      emptyCard,
    );
    expect(result.suggestions.context).toBe("Кофейня списывает выпечку");
    expect(result.suggestions.successTarget).toBeUndefined();
  });
  it("rejects malformed model responses", () => {
    expect(() =>
      validateAnalysis({ questions: [] }, "Текст", emptyCard),
    ).toThrow();
  });
});
