import { describe, expect, it } from "vitest";
import {
  emptyCard,
  computeReadiness,
  normalizeMeaningfulText,
  readinessLevel,
  type Card,
} from "@/domain/task";

describe("readiness", () => {
  it.each([
    "нет",
    "нет данных",
    "нету данных",
    "данных нет",
    "пока нет данных",
    "данных пока нет",
    "данные отсутствуют",
    "данные пока не предоставлены",
    "данных не имеется",
    "не уточнено",
    "не указано",
    "пока неизвестно",
    "  — Данных пока нет!  ",
  ])("does not award absent data: %s", (value) => {
    expect(
      computeReadiness({
        ...emptyCard,
        dataDescription: value,
        dataAccess: "provided",
      }).score,
    ).toBe(0);
  });

  it.each(["", "   ", ".", "...", "—", "?!", "•", "___", " / "])(
    "does not award whitespace or punctuation-only text: %s",
    (value) => {
      expect(computeReadiness({ ...emptyCard, context: value }).score).toBe(0);
      expect(normalizeMeaningfulText(value)).toBe("");
    },
  );

  it.each(["Я", "1", "AI", "2%"])(
    "allows a meaningful short value: %s",
    (value) => {
      expect(computeReadiness({ ...emptyCard, context: value }).score).toBe(10);
      expect(normalizeMeaningfulText(value)).toBe(value);
    },
  );

  it("does not mistake a real data description for a negative phrase", () => {
    expect(
      computeReadiness({
        ...emptyCard,
        dataDescription: "Нет данных о возвратах, но доступны продажи за год",
        dataAccess: "provided",
      }).score,
    ).toBe(20);
  });

  it.each([
    ["context", { context: "Продажи учитывают вручную" }, 10],
    ["need", { need: "Нужно прогнозировать спрос" }, 10],
    ["users", { users: "Управляющий магазина" }, 10],
    [
      "data and access",
      { dataDescription: "Продажи за год", dataAccess: "request" },
      20,
    ],
    ["expected result", { expectedResult: "Рабочий прототип" }, 15],
    [
      "metric and target",
      { successMetric: "Доля списаний", successTarget: "Менее 10%" },
      15,
    ],
    ["constraints", { constraints: "Две недели" }, 10],
    ["contact", { contact: "team@example.com" }, 5],
    ["interaction", { interaction: "Созвон раз в неделю" }, 5],
  ] as [string, Partial<Card>, number][])(
    "awards the exact weight for %s",
    (_label, values, expected) => {
      expect(computeReadiness({ ...emptyCard, ...values }).score).toBe(
        expected,
      );
    },
  );

  it.each(["unknown", "none"] as const)(
    "does not award data when access is %s",
    (dataAccess) => {
      expect(
        computeReadiness({
          ...emptyCard,
          dataDescription: "Продажи за год",
          dataAccess,
        }).score,
      ).toBe(0);
    },
  );

  it.each([
    { successMetric: "Доля списаний", successTarget: "..." },
    { successMetric: "—", successTarget: "Менее 10%" },
  ])("requires meaningful metric and target values", (values) => {
    expect(computeReadiness({ ...emptyCard, ...values }).score).toBe(0);
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
    [0, "draft"],
    [39, "draft"],
    [40, "working"],
    [69, "working"],
    [70, "ready"],
    [89, "ready"],
    [90, "priority"],
    [100, "priority"],
  ])("maps boundary %i", (score, level) => {
    expect(readinessLevel(Number(score)).key).toBe(level);
  });
});
