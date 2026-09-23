import { describe, expect, it } from "vitest";
import { emptyCard, computeReadiness, readinessLevel } from "@/domain/task";

describe("readiness", () => {
  it.each(["нет", "не уточнено", "  Данных нет  "])(
    "does not award absent data: %s",
    (value) => {
      expect(
        computeReadiness({
          ...emptyCard,
          dataDescription: value,
          dataAccess: "provided",
        }).score,
      ).toBe(0);
    },
  );
  it("does not award empty or whitespace fields", () => {
    expect(computeReadiness({ ...emptyCard, context: "   " }).score).toBe(0);
  });
  it("requires data access and a measurable target", () => {
    const card = {
      ...emptyCard,
      dataDescription: "Продажи за месяц",
      successMetric: "Списание",
    };
    expect(computeReadiness(card).score).toBe(0);
    expect(
      computeReadiness({
        ...card,
        dataAccess: "request" as const,
        successTarget: "менее 10%",
      }).score,
    ).toBe(35);
  });
  it("awards 100 and subtracts removed information", () => {
    const full = Object.fromEntries(
      Object.keys(emptyCard).map((key) => [key, "Заполнено"]),
    ) as typeof emptyCard;
    full.dataAccess = "public";
    const score = computeReadiness(full);
    expect(score.score).toBe(100);
    expect(score.breakdown.reduce((sum, row) => sum + row.earned, 0)).toBe(100);
    expect(computeReadiness({ ...full, context: "", contact: "" }).score).toBe(
      85,
    );
  });
  it.each([
    [39, "draft"],
    [40, "working"],
    [69, "working"],
    [70, "ready"],
    [89, "ready"],
    [90, "priority"],
  ])("maps boundary %i", (score, level) => {
    expect(readinessLevel(Number(score)).key).toBe(level);
  });
});
