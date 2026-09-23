import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  actionSchema,
  cardSchema,
  ActionResult,
  Card,
  computeReadiness,
  emptyCard,
  Progress,
  Proposal,
  Snapshot,
  Task,
  Team,
} from "@/domain/task";
import { draftExamples, seedTasks, seedTeams } from "@/domain/demo-data";

export class DemoError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Row = Record<string, string | null>;

function readCard(row: Row): Card {
  const stored = JSON.parse(row.card!);
  const seed = seedTasks.find((task) => task.id === row.id)?.card;
  const unchangedSeed =
    seed &&
    Object.entries(seed).every(
      ([key, value]) =>
        key === "skills" || key === "workFormat" || stored[key] === value,
    );
  return cardSchema.parse({
    ...(unchangedSeed
      ? { workFormat: seed.workFormat, skills: seed.skills }
      : {}),
    ...stored,
  });
}

export class Store {
  private db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:")
      mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, card TEXT NOT NULL, raw_description TEXT NOT NULL, company TEXT NOT NULL, created_at TEXT NOT NULL, confirmed_at TEXT, published_at TEXT);
      CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, profile TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), team_id TEXT NOT NULL REFERENCES teams(id), idea TEXT NOT NULL, plan TEXT NOT NULL, duration TEXT NOT NULL, link TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','selected','rejected')), created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS progress (id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), team_id TEXT NOT NULL REFERENCES teams(id), description TEXT NOT NULL, link TEXT NOT NULL, submitted_at TEXT NOT NULL, confirmed_at TEXT, UNIQUE(task_id,team_id));`);
    this.seed();
  }
  close() {
    this.db.close();
  }
  seed() {
    this.db.exec("BEGIN");
    try {
      const insertTask = this.db.prepare(
        "INSERT OR IGNORE INTO tasks VALUES (?,?,?,?,?,?,?)",
      );
      draftExamples.forEach((draft) =>
        insertTask.run(
          draft.id,
          JSON.stringify({
            ...emptyCard,
            title: draft.title,
            topic: draft.topic,
          }),
          draft.text,
          "Демобизнес",
          "2026-09-23T08:00:00.000Z",
          null,
          null,
        ),
      );
      seedTasks.forEach((task, i) => {
        const date = `2026-09-${String(18 + i).padStart(2, "0")}T09:00:00.000Z`;
        insertTask.run(
          task.id,
          JSON.stringify(task.card),
          task.card.context,
          task.company,
          date,
          date,
          date,
        );
      });
      seedTeams.forEach((team) =>
        this.db
          .prepare("INSERT OR IGNORE INTO teams VALUES (?,?)")
          .run(team.id, JSON.stringify(team)),
      );
      seedTeams.forEach((team, i) =>
        this.db
          .prepare("INSERT OR IGNORE INTO proposals VALUES (?,?,?,?,?,?,?,?,?)")
          .run(
            `proposal-${i + 1}`,
            seedTasks[i % 3].id,
            team.id,
            "Начнём с исследования процесса и проверки ключевой гипотезы.",
            "Изучим данные, соберём прототип и проверим его вместе с бизнесом.",
            "2 недели",
            "https://example.com/prototype",
            "pending",
            "2026-09-23T08:00:00.000Z",
          ),
      );
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  private checkActor(actor: string) {
    if (
      actor !== "business" &&
      !this.db.prepare("SELECT id FROM teams WHERE id=?").get(actor)
    )
      throw new DemoError("Выберите демопрофиль", 403);
  }
  private requireBusiness(actor: string) {
    if (actor !== "business")
      throw new DemoError("Это действие доступно в режиме бизнеса", 403);
  }
  private row(table: "tasks" | "proposals" | "progress", id: string): Row {
    const row = this.db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) as
      Row | undefined;
    if (!row) throw new DemoError("Запись не найдена", 404);
    return row;
  }
  snapshot(actor: string): Snapshot {
    this.checkActor(actor);
    const tasks: Task[] = (
      this.db
        .prepare(
          actor === "business"
            ? "SELECT * FROM tasks"
            : "SELECT * FROM tasks WHERE published_at IS NOT NULL",
        )
        .all() as Row[]
    )
      .map((row) => ({
        id: row.id!,
        card: readCard(row),
        rawDescription: row.raw_description!,
        company: row.company!,
        createdAt: row.created_at!,
        confirmedAt: row.confirmed_at,
        publishedAt: row.published_at,
        readiness: computeReadiness(
          row.confirmed_at ? (JSON.parse(row.card!) as Card) : emptyCard,
        ),
        proposalCount: Number(
          (
            this.db
              .prepare(
                "SELECT count(*) AS count FROM proposals WHERE task_id=?",
              )
              .get(row.id!) as { count: number }
          ).count,
        ),
      }))
      .sort(
        (a, b) =>
          b.readiness.score - a.readiness.score ||
          (a.publishedAt ?? a.createdAt).localeCompare(
            b.publishedAt ?? b.createdAt,
          ) ||
          a.id.localeCompare(b.id),
      );
    const teams: Team[] = (
      this.db.prepare("SELECT * FROM teams ORDER BY id").all() as Row[]
    ).map((row) => ({
      ...seedTeams.find((team) => team.id === row.id),
      ...JSON.parse(row.profile!),
      points:
        Number(
          (
            this.db
              .prepare(
                "SELECT count(*) AS count FROM progress WHERE team_id=? AND confirmed_at IS NOT NULL",
              )
              .get(row.id!) as { count: number }
          ).count,
        ) * 10,
    }));
    const proposals = (
      this.db
        .prepare(
          actor === "business"
            ? "SELECT * FROM proposals ORDER BY created_at DESC"
            : "SELECT * FROM proposals WHERE team_id=? ORDER BY created_at DESC",
        )
        .all(...(actor === "business" ? [] : [actor])) as Row[]
    ).map((row) => ({
      id: row.id!,
      taskId: row.task_id!,
      teamId: row.team_id!,
      idea: row.idea!,
      plan: row.plan!,
      duration: row.duration!,
      link: row.link!,
      status: row.status as Proposal["status"],
      createdAt: row.created_at!,
    }));
    const progress: Progress[] = (
      this.db
        .prepare(
          actor === "business"
            ? "SELECT * FROM progress"
            : "SELECT * FROM progress WHERE team_id=?",
        )
        .all(...(actor === "business" ? [] : [actor])) as Row[]
    ).map((row) => ({
      id: row.id!,
      taskId: row.task_id!,
      teamId: row.team_id!,
      description: row.description!,
      link: row.link!,
      submittedAt: row.submitted_at!,
      confirmedAt: row.confirmed_at,
    }));
    return { tasks, teams, proposals, progress };
  }
  act(actor: string, input: unknown): ActionResult {
    this.checkActor(actor);
    const action = actionSchema.parse(input);
    const now = new Date().toISOString();
    if (action.type === "save-task") {
      this.requireBusiness(actor);
      const existing = action.id ? this.row("tasks", action.id) : null;
      if ((action.publish || existing?.published_at) && !action.confirmed)
        throw new DemoError(
          "Подтвердите сведения перед публикацией или изменением задачи",
        );
      if (action.confirmed && (!action.card.title || !action.card.topic))
        throw new DemoError("Укажите название и тему задачи");
      const id = action.id ?? randomUUID();
      const card = {
        ...action.card,
        title: action.card.title || "Новая задача",
      };
      this.db
        .prepare(
          `INSERT INTO tasks VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET card=excluded.card, raw_description=excluded.raw_description, confirmed_at=excluded.confirmed_at, published_at=excluded.published_at`,
        )
        .run(
          id,
          JSON.stringify(card),
          action.rawDescription,
          existing?.company ?? "Моя компания",
          existing?.created_at ?? now,
          action.confirmed ? now : null,
          existing?.published_at ?? (action.publish ? now : null),
        );
      return { taskId: id };
    }
    if (action.type === "propose") {
      if (actor === "business")
        throw new DemoError("Переключитесь на студенческую команду", 403);
      if (!this.row("tasks", action.taskId).published_at)
        throw new DemoError("Задача ещё не опубликована");
      const id = randomUUID();
      this.db
        .prepare("INSERT INTO proposals VALUES (?,?,?,?,?,?,?,?,?)")
        .run(
          id,
          action.taskId,
          actor,
          action.idea,
          action.plan,
          action.duration,
          action.link,
          "pending",
          now,
        );
      return { proposalId: id };
    }
    if (action.type === "decide") {
      this.requireBusiness(actor);
      const proposal = this.row("proposals", action.proposalId);
      if (proposal.status !== "pending" && proposal.status !== action.status)
        throw new DemoError("Решение по этому предложению уже принято");
      this.db
        .prepare("UPDATE proposals SET status=? WHERE id=?")
        .run(action.status, action.proposalId);
      return { proposalId: action.proposalId };
    }
    if (action.type === "submit-progress") {
      if (
        actor === "business" ||
        !this.db
          .prepare(
            "SELECT id FROM proposals WHERE task_id=? AND team_id=? AND status='selected'",
          )
          .get(action.taskId, actor)
      )
        throw new DemoError("Сначала бизнес должен выбрать вашу команду", 403);
      const existing = this.db
        .prepare("SELECT * FROM progress WHERE task_id=? AND team_id=?")
        .get(action.taskId, actor) as Row | undefined;
      if (existing?.confirmed_at)
        throw new DemoError("Первый результат уже подтверждён");
      const id = existing?.id ?? randomUUID();
      this.db
        .prepare(
          "INSERT INTO progress VALUES (?,?,?,?,?,?,NULL) ON CONFLICT(task_id,team_id) DO UPDATE SET description=excluded.description, link=excluded.link, submitted_at=excluded.submitted_at",
        )
        .run(id, action.taskId, actor, action.description, action.link, now);
      return { progressId: id };
    }
    this.requireBusiness(actor);
    const progress = this.row("progress", action.progressId);
    if (
      !this.db
        .prepare(
          "SELECT id FROM proposals WHERE task_id=? AND team_id=? AND status='selected'",
        )
        .get(progress.task_id!, progress.team_id!)
    )
      throw new DemoError("Команда не выбрана для этой задачи");
    this.db
      .prepare(
        "UPDATE progress SET confirmed_at=? WHERE id=? AND confirmed_at IS NULL",
      )
      .run(now, action.progressId);
    return { progressId: action.progressId };
  }
}

const globalStore = globalThis as unknown as { praktikaStore?: Store };
export function getStore() {
  return (globalStore.praktikaStore ??= new Store(
    process.env.DATABASE_PATH || resolve("data/praktika.sqlite"),
  ));
}
