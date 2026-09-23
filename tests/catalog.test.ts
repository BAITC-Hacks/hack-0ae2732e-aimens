import { describe, expect, it } from "vitest";
import {
  cardSchema,
  computeReadiness,
  emptyCard,
  type Card,
  type Task,
  type Team,
} from "@/domain/task";
import {
  filterCatalog,
  recommendationForTask,
  recommendTasks,
} from "@/domain/catalog";

function task(
  id: string,
  card: Partial<Card> = {},
  publishedAt: string | null = "2026-01-01T10:00:00.000Z",
): Task {
  const value = { ...emptyCard, title: id, ...card };
  return {
    id,
    card: value,
    company: "Кофейня Север",
    rawDescription: "",
    createdAt: "2026-01-01T09:00:00.000Z",
    publishedAt,
    confirmedAt: publishedAt,
    readiness: computeReadiness(value),
    proposalCount: 0,
  };
}

const team: Team = {
  id: "team-test",
  name: "Test team",
  tagline: "",
  initials: "TT",
  points: 0,
  skills: ["Python", "SQL"],
  interests: ["Маркетинг"],
};

describe("catalog metadata", () => {
  it("reads a legacy card with safe defaults without changing its readiness", () => {
    const legacy = { ...emptyCard, context: "Работаем с отзывами" } as Record<
      string,
      unknown
    >;
    delete legacy.workFormat;
    delete legacy.skills;
    const restored = cardSchema.parse(legacy);
    expect(restored.workFormat).toBe("unspecified");
    expect(restored.skills).toEqual([]);
    expect(computeReadiness(restored).score).toBe(10);
    expect(
      computeReadiness({
        ...restored,
        skills: ["Python"],
        workFormat: "remote",
      }).score,
    ).toBe(10);
  });
});

describe("catalog filters", () => {
  it("keeps all published readiness levels available and excludes private drafts", () => {
    const low = task("low");
    const higher = task("higher", {
      context: "Есть контекст",
      need: "Нужно решение",
    });
    const privateDraft = task("private", {}, null);
    expect(
      filterCatalog([low, privateDraft, higher]).map((item) => item.id),
    ).toEqual(["higher", "low"]);
  });

  it("combines case-insensitive search, topic, level and work format", () => {
    const match = task("match", {
      topic: "Маркетинг",
      skills: ["Python"],
      workFormat: "remote",
    });
    const otherFormat = task("onsite", {
      topic: "Маркетинг",
      skills: ["Python"],
      workFormat: "onsite",
    });
    const otherTopic = task("education", {
      topic: "Образование",
      skills: ["Python"],
      workFormat: "remote",
    });
    expect(
      filterCatalog([otherFormat, otherTopic, match], {
        query: "  PYTHON   север ",
        topic: "Маркетинг",
        level: "draft",
        workFormat: "remote",
      }).map((item) => item.id),
    ).toEqual(["match"]);
    expect(filterCatalog([match], { query: "неизвестное" })).toEqual([]);
    expect(filterCatalog([match], { level: "priority" })).toEqual([]);
  });

  it("sorts equal scores by earlier publication then ID without mutating the input", () => {
    const newer = task("newer", {}, "2026-01-03T10:00:00.000Z");
    const first = task("a");
    const second = task("b");
    const input = [newer, second, first];
    expect(filterCatalog(input).map((item) => item.id)).toEqual([
      "a",
      "b",
      "newer",
    ]);
    expect(input.map((item) => item.id)).toEqual(["newer", "b", "a"]);
    expect(
      filterCatalog(input, { sort: "newest" }).map((item) => item.id),
    ).toEqual(["newer", "a", "b"]);
  });
});

describe("explainable recommendations", () => {
  it("recommends a relevant low-score task using its topic and matching skills", () => {
    const relevant = task("relevant", {
      topic: "Маркетинг",
      skills: ["python", "NLP"],
    });
    const unrelated = task("unrelated", {
      topic: "Образование",
      context: "Есть контекст",
      need: "Нужно решение",
    });
    expect(
      recommendTasks([unrelated, relevant], team).map((item) => item.task.id),
    ).toEqual(["relevant"]);
    expect(recommendationForTask(relevant, team).reasons).toEqual([
      "Тема «Маркетинг» входит в интересы команды",
      "Совпадают навыки: python",
    ]);
    expect(relevant.readiness.score).toBe(0);
    expect(filterCatalog([unrelated, relevant])).toHaveLength(2);
  });

  it("does not invent matches or count duplicate skills twice", () => {
    const noMatch = task("none", { topic: "Логистика" });
    expect(recommendTasks([noMatch], team)).toEqual([]);
    expect(recommendTasks([noMatch])).toEqual([]);
    const duplicate = task("duplicate", { skills: ["Python", "python"] });
    expect(recommendationForTask(duplicate, team).matchScore).toBe(1);
    expect(recommendTasks([duplicate], team, 0)).toEqual([]);
    expect(
      recommendTasks([task("private", { skills: ["Python"] }, null)], team),
    ).toEqual([]);
  });
});
