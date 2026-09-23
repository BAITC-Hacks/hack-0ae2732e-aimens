import { describe, expect, it } from "vitest";
import { suggestTopicLocally } from "@/server/ai";

describe("topic suggestions", () => {
  it("recognizes a plain language selling request as commerce", () => {
    expect(
      suggestTopicLocally("Хочу продавать домашнюю выпечку через интернет")
        .topic,
    ).toBe("Торговля");
  });

  it("provides a low-confidence manual fallback for vague descriptions", () => {
    const result = suggestTopicLocally("Нужно улучшить один процесс");
    expect(result.topic).toBe("Сервисы");
    expect(result.confidence).toBeLessThan(0.5);
  });
});
