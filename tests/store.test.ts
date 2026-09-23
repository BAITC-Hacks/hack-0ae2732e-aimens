import { afterEach, describe, expect, it } from "vitest";
import { Store } from "@/server/store";
import { computeReadiness, emptyCard, QualityAssessment } from "@/domain/task";
import { issueReviewTicket } from "@/server/review-tickets";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const stores: Store[] = [];
function fresh() {
  const store = new Store(":memory:");
  stores.push(store);
  return store;
}
afterEach(() => stores.splice(0).forEach((store) => store.close()));

describe("demo workflow", () => {
  it("migrates existing databases without losing tasks or requiring assessment", () => {
    const path = join(
      mkdtempSync(join(tmpdir(), "sanalink-migration-")),
      "demo.sqlite",
    );
    const oldDb = new DatabaseSync(path);
    const card = {
      ...emptyCard,
      title: "Существующая задача",
      context: "Контекст",
    };
    try {
      oldDb.exec(
        "CREATE TABLE tasks (id TEXT PRIMARY KEY, card TEXT NOT NULL, raw_description TEXT NOT NULL, company TEXT NOT NULL, created_at TEXT NOT NULL, confirmed_at TEXT, published_at TEXT)",
      );
      oldDb
        .prepare("INSERT INTO tasks VALUES (?,?,?,?,?,?,?)")
        .run(
          "existing-task",
          JSON.stringify(card),
          "Исходный ввод",
          "Бизнес",
          "2026-09-01T08:00:00.000Z",
          "2026-09-01T08:00:00.000Z",
          "2026-09-01T08:00:00.000Z",
        );
    } finally {
      oldDb.close();
    }
    const store = new Store(path);
    stores.push(store);
    const task = store
      .snapshot("team-1")
      .tasks.find((item) => item.id === "existing-task")!;
    expect(task.card).toEqual(card);
    expect(task.rawDescription).toBe("Исходный ввод");
    expect(task.qualityAssessment).toBeNull();
    expect(task.readiness).toEqual(computeReadiness(card));
    store.seed();
    expect(store.snapshot("business").tasks).toHaveLength(11);
  });

  it("stores advisory assessment without replacing official readiness or sort order", () => {
    const store = fresh();
    const original = store
      .snapshot("business")
      .tasks.find((task) => task.id === "task-coffee")!;
    const assessment: QualityAssessment = {
      score: 0,
      summary: "Рекомендация уточнить формулировки",
      mode: "local",
      dimensions: computeReadiness(original.card).breakdown.map((row) => ({
        field: row.field,
        label: row.label,
        max: row.max,
        score: 0,
        reason: "Уточните содержание поля",
      })),
    };
    const result = store.act("business", {
      type: "save-task",
      id: original.id,
      card: original.card,
      rawDescription: original.rawDescription,
      confirmed: true,
      publish: true,
      reviewToken: issueReviewTicket(
        original.rawDescription,
        original.card,
        assessment,
      ),
    });
    const published = store
      .snapshot("team-1")
      .tasks.find((task) => task.id === result.taskId)!;
    expect(published.qualityAssessment).toEqual(assessment);
    expect(published.readiness).toEqual(computeReadiness(original.card));
    expect(published.readiness.score).toBe(100);
    expect(store.snapshot("team-1").tasks[0].id).toBe(original.id);

    // A used ticket is optional, and client-supplied ratings are never trusted.
    store.act("business", {
      type: "save-task",
      id: original.id,
      card: { ...original.card, context: "" },
      rawDescription: original.rawDescription,
      confirmed: true,
      publish: false,
      reviewToken: "00000000-0000-4000-8000-000000000000",
      qualityAssessment: assessment,
      readiness: { score: 100 },
    });
    const edited = store
      .snapshot("team-1")
      .tasks.find((task) => task.id === original.id)!;
    expect(edited.qualityAssessment).toBeNull();
    expect(edited.readiness.score).toBe(90);
  });

  it("creates a usable custom team without affecting existing teams", () => {
    const store = fresh();
    const before = store.snapshot("business").teams;
    const { teamId } = store.act("business", {
      type: "create-team",
      name: "Qyran Lab",
      interests: ["IT и данные", "Торговля"],
      iconKey: "eagle",
    });
    expect(
      store.snapshot(teamId!).teams.find((team) => team.id === teamId),
    ).toMatchObject({
      name: "Qyran Lab",
      interests: ["IT и данные", "Торговля"],
      iconKey: "eagle",
      isCustom: true,
      points: 0,
    });
    expect(
      store.snapshot("business").teams.filter((team) => team.id !== teamId),
    ).toEqual(before);
    const { proposalId } = store.act(teamId!, {
      type: "propose",
      taskId: "task-marketing",
      idea: "Проверим гипотезу",
      plan: "Соберём прототип",
      duration: "2 недели",
      link: "https://example.com/prototype",
    });
    expect(
      store
        .snapshot(teamId!)
        .proposals.find((proposal) => proposal.id === proposalId)?.teamId,
    ).toBe(teamId);
  });
  it("restores legacy metadata only for unchanged seed cards", () => {
    const path = join(
      mkdtempSync(join(tmpdir(), "sanalink-legacy-")),
      "legacy.sqlite",
    );
    const first = new Store(path);
    const original = first.snapshot("business");
    first.close();

    // Simulate cards persisted before workFormat and skills existed.
    const legacyDb = new DatabaseSync(path);
    try {
      for (const id of ["task-coffee", "task-education"]) {
        const task = original.tasks.find((item) => item.id === id)!;
        const card: Record<string, unknown> = { ...task.card };
        delete card.workFormat;
        delete card.skills;
        if (id === "task-coffee") {
          card.title = "Новая задача учебного центра";
          card.topic = "Образование";
        }
        legacyDb
          .prepare("UPDATE tasks SET card=? WHERE id=?")
          .run(JSON.stringify(card), id);
      }
    } finally {
      legacyDb.close();
    }

    const reopened = new Store(path);
    stores.push(reopened);
    const tasks = reopened.snapshot("team-1").tasks;
    const edited = tasks.find((task) => task.id === "task-coffee")!;
    const untouched = tasks.find((task) => task.id === "task-education")!;
    const originalEdited = original.tasks.find(
      (task) => task.id === edited.id,
    )!;
    const originalUntouched = original.tasks.find(
      (task) => task.id === untouched.id,
    )!;

    expect(edited.card).toMatchObject({
      title: "Новая задача учебного центра",
      topic: "Образование",
      workFormat: "unspecified",
      skills: [],
    });
    expect(edited.readiness).toEqual(originalEdited.readiness);
    expect(edited.confirmedAt).toBe(originalEdited.confirmedAt);
    expect(untouched.card).toEqual(originalUntouched.card);
    expect(untouched.readiness).toEqual(originalUntouched.readiness);
  });
  it("persists confirmed tasks, proposals and rewards across a database reopen", () => {
    const path = join(
      mkdtempSync(join(tmpdir(), "praktika-store-")),
      "demo.sqlite",
    );
    const first = new Store(path);
    const taskId = first.act("business", {
      type: "save-task",
      card: { ...emptyCard, title: "Сохранённая задача" },
      rawDescription: "Исходное описание",
      confirmed: true,
      publish: true,
    }).taskId!;
    const proposalId = first.act("team-2", {
      type: "propose",
      taskId,
      idea: "Идея",
      plan: "План",
      duration: "1 день",
      link: "https://example.com",
    }).proposalId!;
    first.act("business", { type: "decide", proposalId, status: "selected" });
    const progressId = first.act("team-2", {
      type: "submit-progress",
      taskId,
      description: "Готово",
      link: "https://example.com/result",
    }).progressId!;
    first.act("business", { type: "confirm-progress", progressId });
    const before = first.snapshot("business");
    first.close();
    const second = new Store(path);
    stores.push(second);
    expect(second.snapshot("business")).toEqual(before);
    expect(
      second.snapshot("business").teams.find((team) => team.id === "team-2")
        ?.points,
    ).toBe(10);
  });
  it("reduces the public score only after confirmed saving and sorts deterministically", () => {
    const store = fresh();
    const original = store.snapshot("business").tasks[0];
    const card = {
      ...original.card,
      dataDescription: "",
      dataAccess: "unknown",
    };
    expect(() =>
      store.act("business", {
        type: "save-task",
        id: original.id,
        card,
        rawDescription: "",
        confirmed: false,
        publish: true,
      }),
    ).toThrow();
    expect(store.snapshot("team-3").tasks[0].readiness.score).toBe(100);
    store.act("business", {
      type: "save-task",
      id: original.id,
      card,
      rawDescription: "",
      confirmed: true,
      publish: true,
    });
    expect(
      store.snapshot("team-3").tasks.find((task) => task.id === original.id)
        ?.readiness.score,
    ).toBe(80);
    expect(store.snapshot("team-3").tasks[0].id).toBe("task-education");
    const nextId = store.act("business", {
      type: "save-task",
      card: original.card,
      rawDescription: "",
      confirmed: true,
      publish: true,
    }).taskId!;
    const otherId = store.act("business", {
      type: "save-task",
      card: original.card,
      rawDescription: "",
      confirmed: true,
      publish: true,
    }).taskId!;
    const tasks = store
      .snapshot("team-3")
      .tasks.filter((task) => task.id === nextId || task.id === otherId);
    expect(tasks).toEqual(
      [...tasks].sort(
        (a, b) =>
          a.publishedAt!.localeCompare(b.publishedAt!) ||
          a.id.localeCompare(b.id),
      ),
    );
    expect(store.snapshot("team-1").tasks).toEqual(
      store.snapshot("team-5").tasks,
    );
  });
  it("allows rejection of every proposal and accepts more proposals afterwards", () => {
    const store = fresh();
    for (const proposal of store.snapshot("business").proposals)
      store.act("business", {
        type: "decide",
        proposalId: proposal.id,
        status: "rejected",
      });
    for (let i = 0; i < 6; i++)
      store.act("team-1", {
        type: "propose",
        taskId: "task-marketing",
        idea: "Идея",
        plan: "План",
        duration: "1 день",
        link: "https://example.com",
      });
    expect(
      store
        .snapshot("business")
        .proposals.filter((proposal) => proposal.status === "rejected"),
    ).toHaveLength(5);
    expect(
      store
        .snapshot("business")
        .proposals.filter((proposal) => proposal.status === "pending"),
    ).toHaveLength(6);
  });
  it("seeds idempotently and permits low-score published tasks", () => {
    const store = fresh();
    store.seed();
    store.seed();
    expect(store.snapshot("business").tasks).toHaveLength(10);
    const { taskId } = store.act("business", {
      type: "save-task",
      card: { ...emptyCard, title: "Новая задача", topic: "Торговля" },
      rawDescription: "",
      confirmed: true,
      publish: true,
    });
    expect(
      store.snapshot("team-1").tasks.find((t) => t.id === taskId)?.readiness
        .score,
    ).toBe(0);
  });
  it("keeps unconfirmed drafts out of the catalog and prevents unconfirmed public edits", () => {
    const store = fresh();
    const result = store.act("business", {
      type: "save-task",
      card: { ...emptyCard, title: "Черновик", topic: "Торговля" },
      rawDescription: "",
      confirmed: false,
      publish: false,
    });
    expect(
      store.snapshot("team-1").tasks.some((t) => t.id === result.taskId),
    ).toBe(false);
    expect(() =>
      store.act("business", {
        type: "save-task",
        id: "task-coffee",
        card: { ...emptyCard, title: "Изменение", topic: "Торговля" },
        rawDescription: "",
        confirmed: false,
        publish: false,
      }),
    ).toThrow();
  });
  it("persists five editable demo drafts without publishing, scoring or overwriting them", () => {
    const store = fresh();
    const drafts = store
      .snapshot("business")
      .tasks.filter((task) => !task.publishedAt);
    expect(drafts).toHaveLength(5);
    for (const draft of drafts) {
      expect(draft.confirmedAt).toBeNull();
      expect(draft.readiness.score).toBe(0);
      expect(draft.rawDescription.length).toBeGreaterThan(20);
      expect(
        store.snapshot("team-1").tasks.some((task) => task.id === draft.id),
      ).toBe(false);
    }
    const draft = drafts[0];
    store.act("business", {
      type: "save-task",
      id: draft.id,
      card: { ...draft.card, title: "Моя правка" },
      rawDescription: "Пользовательское описание",
      confirmed: false,
      publish: false,
    });
    store.seed();
    const edited = store
      .snapshot("business")
      .tasks.find((task) => task.id === draft.id)!;
    expect(edited.card.title).toBe("Моя правка");
    expect(edited.rawDescription).toBe("Пользовательское описание");
    store.act("business", {
      type: "save-task",
      id: draft.id,
      card: edited.card,
      rawDescription: edited.rawDescription,
      confirmed: true,
      publish: true,
    });
    store.seed();
    expect(
      store.snapshot("team-5").tasks.find((task) => task.id === draft.id)?.card
        .title,
    ).toBe("Моя правка");
    expect(store.snapshot("business").tasks).toHaveLength(10);
  });
  it("selects multiple teams and awards progress only once", () => {
    const store = fresh();
    const create = (actor: string) =>
      store.act(actor, {
        type: "propose",
        taskId: "task-marketing",
        idea: "Проверим гипотезу",
        plan: "Соберём прототип",
        duration: "2 недели",
        link: "https://example.com/prototype",
      }).proposalId!;
    const first = create("team-1");
    const second = create("team-2");
    store.act("business", {
      type: "decide",
      proposalId: first,
      status: "selected",
    });
    store.act("business", {
      type: "decide",
      proposalId: second,
      status: "selected",
    });
    expect(
      store
        .snapshot("business")
        .proposals.filter(
          (p) => p.taskId === "task-marketing" && p.status === "selected",
        ),
    ).toHaveLength(2);
    expect(store.snapshot("team-1").teams[0].points).toBe(0);
    const progressId = store.act("team-1", {
      type: "submit-progress",
      taskId: "task-marketing",
      description: "Первый прототип",
      link: "https://example.com/result",
    }).progressId!;
    store.act("business", { type: "confirm-progress", progressId });
    store.act("business", { type: "confirm-progress", progressId });
    expect(store.snapshot("team-1").teams[0].points).toBe(10);
  });
  it("enforces demo roles and requires selection for progress", () => {
    const store = fresh();
    expect(() =>
      store.act("team-1", {
        type: "decide",
        proposalId: "proposal-1",
        status: "selected",
      }),
    ).toThrow();
    expect(() =>
      store.act("team-5", {
        type: "submit-progress",
        taskId: "task-coffee",
        description: "Без выбора",
        link: "https://example.com/result",
      }),
    ).toThrow();
    expect(() =>
      store.act("business", {
        type: "propose",
        taskId: "task-coffee",
        idea: "Идея",
        plan: "План",
        duration: "1 день",
        link: "javascript:alert(1)",
      }),
    ).toThrow();
  });
});
