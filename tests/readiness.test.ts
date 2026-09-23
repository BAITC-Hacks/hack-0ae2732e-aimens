import { describe, expect, it } from "vitest";
import {
  emptyCard,
  computeReadiness,
  readinessLevel,
  fields,
  normalizeMeaningfulText,
} from "@/domain/task";

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
  it.each([
    "нет данных",
    "нету данных",
    "данных пока нет",
    "данные отсутствуют",
    "— Данных пока нет!",
  ])("does not award missing data: %s", (value) => {
    expect(
      computeReadiness({
        ...emptyCard,
        dataDescription: value,
        dataAccess: "provided",
      }).score,
    ).toBe(0);
  });
  it.each([".", "...", "—", "?!", "___"])(
    "does not award punctuation-only content: %s",
    (value) => {
      expect(normalizeMeaningfulText(value)).toBe("");
      expect(computeReadiness({ ...emptyCard, context: value }).score).toBe(0);
    },
  );
  it.each(["Я", "1", "AI", "2%", "123", "asdfasdf lorem ipsum"])(
    "does not score content without useful task detail: %s",
    (value) => {
      expect(normalizeMeaningfulText(value)).toBe(value);
      expect(computeReadiness({ ...emptyCard, context: value }).score).toBe(0);
    },
  );
  it("credits actual data even when it mentions a missing subset", () => {
    expect(
      computeReadiness({
        ...emptyCard,
        dataDescription: "Нет данных о возвратах, но доступны продажи за год",
        dataAccess: "provided",
      }).score,
    ).toBe(20);
  });
  it("requires meaningful metric and target", () => {
    expect(
      computeReadiness({
        ...emptyCard,
        successMetric: "Доля списаний",
        successTarget: "...",
      }).score,
    ).toBe(0);
  });
  it("requires data access and a measurable target", () => {
    const card = {
      ...emptyCard,
      dataDescription: "Продажи за месяц",
      successMetric: "Доля списаний по заказам",
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
    const full = { ...emptyCard };
    const useful: Record<string, string> = {
      context: "Сеть кофеен списывает непроданную выпечку каждый вечер",
      need: "Спрогнозировать спрос и сократить остатки продукции",
      users: "Управляющий кафе и сотрудники кухни",
      dataDescription: "История продаж по дням и остатки ассортимента",
      expectedResult: "Панель с прогнозом количества выпечки на завтра",
      successMetric: "Точность прогноза по каждой позиции",
      successTarget: "Снизить списания минимум на 20 процентов",
      constraints: "Первый прототип нужен в течение шести недель",
      contact: "manager@example.com",
      interaction: "Еженедельная встреча и доступ к управляющему",
    };
    for (const { key } of fields) full[key] = useful[key];
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
