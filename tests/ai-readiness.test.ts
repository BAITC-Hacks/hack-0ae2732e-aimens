import { describe, expect, it } from "vitest";
import { emptyCard } from "@/domain/task";
import { localAnalysis } from "@/server/ai";
import { draftExamples, seedTasks } from "@/domain/demo-data";

describe("AI and readiness consistency", () => {
  it("uses explicit description facts to ask about gaps without filling the card", () => {
    const coffee = localAnalysis(draftExamples[0].text, emptyCard);
    const delivery = localAnalysis(draftExamples[2].text, emptyCard);
    expect(delivery.questions).not.toEqual(coffee.questions);
    const questions = new Map(
      delivery.questions.map((q) => [q.field, q.question]),
    );
    expect(questions.get("dataDescription")).toMatch(/доступ/);
    expect(questions.get("dataDescription")).not.toMatch(/Какие данные/);
    expect(questions.has("successMetric")).toBe(false);
    expect(questions.has("successTarget")).toBe(false);
    expect(delivery.suggestions).toEqual({});
    expect(delivery.sources).toEqual({});
    expect(delivery.missingFields).toContain("successTarget");
    expect(emptyCard.successTarget).toBe("");
  });
  it("does not infer available data or a target from negation or an unrelated number", () => {
    const result = localAnalysis(
      "Таблицы данных нет. У нас 40 курьеров, хотим улучшить работу.",
      emptyCard,
    );
    expect(
      result.questions.find((q) => q.field === "dataDescription")?.question,
    ).toMatch(/Какие данные/);
    expect(result.questions.some((q) => q.field === "successMetric")).toBe(
      true,
    );
    expect(
      localAnalysis(
        "У нас нет CSV, есть только идея.",
        emptyCard,
      ).questions.find((q) => q.field === "dataDescription")?.question,
    ).toMatch(/Какие данные/);
  });
  it("asks about access when the data exists but access is explicitly unavailable", () => {
    for (const description of [
      "Есть таблица, но доступа нет.",
      "Есть CSV, но нет доступа.",
    ]) {
      const question = localAnalysis(description, emptyCard).questions.find(
        (q) => q.field === "dataDescription",
      )?.question;
      expect(question).toMatch(/доступ/);
      expect(question).not.toMatch(/Какие данные/);
    }
  });
  it("rechecks answers, keeps filled cards editable and returns distinct questions", () => {
    const first = localAnalysis("", emptyCard);
    const answered = {
      ...emptyCard,
      need: "Сократить списания",
      dataDescription: "CSV продаж",
      dataAccess: "provided" as const,
      expectedResult: "Прототип",
      successMetric: "Доля списаний",
      users: "Пекарь",
    };
    const second = localAnalysis(draftExamples[0].text, answered);
    expect(second.questions).not.toEqual(first.questions);
    expect(
      second.questions.every(
        (q) =>
          ![
            "need",
            "dataDescription",
            "expectedResult",
            "successMetric",
            "users",
          ].includes(q.field),
      ),
    ).toBe(true);
    for (const result of [
      first,
      second,
      localAnalysis(draftExamples[0].text, seedTasks[0].card),
    ]) {
      expect(result.questions.length).toBeGreaterThanOrEqual(3);
      expect(result.questions.length).toBeLessThanOrEqual(5);
      expect(new Set(result.questions.map((q) => q.field)).size).toBe(
        result.questions.length,
      );
    }
    expect(
      localAnalysis("", seedTasks[0].card).questions.every((q) =>
        q.question.startsWith("Уточните:"),
      ),
    ).toBe(true);
  });
  it("asks for values that the readiness formula treats as missing", () => {
    const card = {
      ...emptyCard,
      context: "—",
      need: "Нужно сократить ручную работу",
      users: "Менеджер",
      dataDescription: "данных нет",
      dataAccess: "provided" as const,
      expectedResult: "Прототип",
      successMetric: "Время обработки",
      successTarget: "Не более 2 минут",
      constraints: "Две недели",
      contact: "demo@example.com",
      interaction: "Созвон раз в неделю",
    };

    const result = localAnalysis("Описание задачи для анализа", card);
    const questions = new Map(
      result.questions.map((question) => [question.field, question.question]),
    );

    expect(result.missingFields).toContain("context");
    expect(result.missingFields).toContain("dataDescription");
    expect(result.missingFields).not.toContain("dataAccess");
    expect(questions.get("context")).toBe(
      "Как сейчас устроен процесс и на каком шаге возникает проблема?",
    );
    expect(questions.get("dataDescription")).toBe(
      "Какие данные или примеры вы сможете предоставить команде и как она получит к ним доступ?",
    );
  });
});
