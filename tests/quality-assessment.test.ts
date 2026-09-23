import { afterEach, describe, expect, it, vi } from "vitest";
import { assessTaskQuality } from "@/server/ai";
import { Card, emptyCard } from "@/domain/task";

const completeCard: Card = {
  ...emptyCard,
  title: "Прогноз спроса на выпечку",
  context: "Сеть кофеен списывает непроданную выпечку каждый вечер",
  need: "Спрогнозировать спрос и сократить остатки продукции",
  users: "Управляющий кафе и сотрудники кухни",
  dataDescription: "История продаж по дням и остатки ассортимента",
  dataAccess: "provided",
  expectedResult: "Панель с прогнозом количества выпечки на завтра",
  successMetric: "Точность прогноза по каждой позиции",
  successTarget: "Снизить списания минимум на 20 процентов",
  constraints: "Первый прототип нужен в течение шести недель",
  contact: "manager@example.com",
  interaction: "Еженедельная встреча и доступ к управляющему",
};

afterEach(() => vi.unstubAllEnvs());

describe("final task quality assessment", () => {
  it("keeps the final total equal to its dimension breakdown", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("AI_MODE", "local");
    const result = await assessTaskQuality(
      "Управляющий кофейней хочет точнее планировать выпечку на каждый день",
      completeCard,
    );
    expect(result.score).toBe(100);
    expect(result.dimensions.reduce((sum, row) => sum + row.score, 0)).toBe(
      result.score,
    );
  });

  it("caps a fully filled card when its source description is junk", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("AI_MODE", "local");
    const result = await assessTaskQuality(
      "asdfasdf lorem ipsum test foo bar baz",
      completeCard,
    );
    expect(result.score).toBeLessThanOrEqual(20);
    expect(result.dimensions.reduce((sum, row) => sum + row.score, 0)).toBe(
      result.score,
    );
  });
});
