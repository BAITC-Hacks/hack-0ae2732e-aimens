import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeReadiness,
  emptyCard,
  qualityAssessmentSchema,
  QualityAssessment,
} from "@/domain/task";
import {
  consumeReviewTicket,
  issueReviewTicket,
} from "@/server/review-tickets";

const card = { ...emptyCard, title: "Задача", context: "Контекст задачи" };
const assessment: QualityAssessment = {
  score: 0,
  mode: "local",
  summary: "Рекомендация уточнить задачу",
  dimensions: computeReadiness(card).breakdown.map((row) => ({
    field: row.field,
    label: row.label,
    max: row.max,
    score: 0,
    reason: "Уточните содержание поля",
  })),
};

afterEach(() => vi.useRealTimers());

describe("optional review tickets", () => {
  it("binds advice to normalized input and consumes it only once", () => {
    const token = issueReviewTicket(
      " Исходное описание ",
      { ...card, context: " Контекст задачи " },
      assessment,
    );
    expect(consumeReviewTicket(token, "Исходное описание", card)).toEqual(
      assessment,
    );
    expect(consumeReviewTicket(token, "Исходное описание", card)).toBeNull();
  });

  it("does not attach advice to an edited card or source", () => {
    const first = issueReviewTicket("Описание", card, assessment);
    const second = issueReviewTicket("Описание", card, assessment);
    expect(
      consumeReviewTicket(first, "Описание", {
        ...card,
        context: "Новая ситуация",
      }),
    ).toBeNull();
    expect(consumeReviewTicket(second, "Другое описание", card)).toBeNull();
  });

  it("expires advice after fifteen minutes", () => {
    vi.useFakeTimers();
    const token = issueReviewTicket("Описание", card, assessment);
    vi.advanceTimersByTime(15 * 60_000 + 1);
    expect(consumeReviewTicket(token, "Описание", card)).toBeNull();
  });

  it("rejects altered totals, repeated criteria and invalid weights", () => {
    expect(
      qualityAssessmentSchema.safeParse({ ...assessment, score: 100 }).success,
    ).toBe(false);
    expect(
      qualityAssessmentSchema.safeParse({
        ...assessment,
        dimensions: assessment.dimensions.map(() => assessment.dimensions[0]),
      }).success,
    ).toBe(false);
    expect(
      qualityAssessmentSchema.safeParse({
        ...assessment,
        dimensions: assessment.dimensions.map((row, index) =>
          index === 0 ? { ...row, max: 20 } : row,
        ),
      }).success,
    ).toBe(false);
  });
});
