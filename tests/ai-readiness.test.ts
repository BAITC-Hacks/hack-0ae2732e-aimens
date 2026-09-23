import { describe, expect, it } from "vitest";
import { emptyCard } from "@/domain/task";
import { localAnalysis } from "@/server/ai";

describe("AI and readiness consistency", () => {
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
