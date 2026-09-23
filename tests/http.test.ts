import { afterAll, beforeAll, expect, it } from "vitest";
import { POST, GET } from "@/app/api/demo/route";
import { POST as analyze } from "@/app/api/analyze/route";
import { emptyCard } from "@/domain/task";
import { Store } from "@/server/store";

const state = globalThis as unknown as { praktikaStore?: Store };
let store: Store;

beforeAll(() => {
  store = new Store(":memory:");
  state.praktikaStore = store;
});
afterAll(() => {
  store.close();
  delete state.praktikaStore;
});

const request = (body: unknown, actor = "business") =>
  new Request("http://localhost/api/demo", {
    method: "POST",
    headers: { "x-demo-actor": actor },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const proposal = {
  type: "propose",
  taskId: "task-coffee",
  idea: "Идея",
  plan: "План",
  duration: "1 день",
  link: "https://example.com",
};

it("rejects malformed JSON without crashing either route", async () => {
  expect((await POST(request("{"))).status).toBe(400);
  expect((await analyze(request("{"))).status).toBe(422);
});

it("rejects oversized bodies for both routes", async () => {
  expect((await POST(request("x".repeat(65_001)))).status).toBe(413);
  expect((await analyze(request("x".repeat(65_001)))).status).toBe(413);
});

it("rejects unsafe links and unknown or unauthorized actors", async () => {
  expect(
    (await POST(request({ ...proposal, link: "javascript:alert(1)" }, "team-1")))
      .status,
  ).toBe(422);
  expect(
    (
      await GET(
        new Request("http://localhost/api/demo", {
          headers: { "x-demo-actor": "team-999" },
        }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await POST(
        request(
          { type: "decide", proposalId: "proposal-1", status: "selected" },
          "team-2",
        ),
      )
    ).status,
  ).toBe(403);
  expect(
    store.snapshot("team-1").proposals.every((p) => p.teamId === "team-1"),
  ).toBe(true);
});

it("keeps drafts private and refuses proposals before publication", async () => {
  const response = await POST(
    request({
      type: "save-task",
      card: { ...emptyCard, title: "Аудит" },
      rawDescription: "Описание",
      confirmed: false,
      publish: false,
    }),
  );
  expect(response.status).toBe(200);
  const { taskId } = await response.json();
  expect(store.snapshot("team-1").tasks.some((t) => t.id === taskId)).toBe(false);
  expect(
    (await POST(request({ ...proposal, taskId }, "team-1"))).status,
  ).toBe(400);
});

it("ignores client score and rewards same-team duplicate proposals only once", async () => {
  const response = await POST(
    request({
      type: "save-task",
      card: { ...emptyCard, title: "Низкая готовность" },
      rawDescription: "Описание",
      confirmed: true,
      publish: true,
      readiness: { score: 100 },
      score: 100,
    }),
  );
  expect(response.status).toBe(200);
  const { taskId } = await response.json();
  expect(
    store.snapshot("team-1").tasks.find((t) => t.id === taskId)?.readiness.score,
  ).toBe(0);
  for (let index = 0; index < 2; index++) {
    const created = await POST(request({ ...proposal, taskId }, "team-1"));
    const { proposalId } = await created.json();
    expect(
      (await POST(request({ type: "decide", proposalId, status: "selected" })))
        .status,
    ).toBe(200);
  }
  expect(
    (
      await POST(
        request(
          {
            type: "submit-progress",
            taskId,
            description: "Чужой результат",
            link: "https://example.com",
          },
          "team-2",
        ),
      )
    ).status,
  ).toBe(403);
  const result = await POST(
    request(
      {
        type: "submit-progress",
        taskId,
        description: "Первый результат",
        link: "https://example.com",
      },
      "team-1",
    ),
  );
  const { progressId } = await result.json();
  expect(
    (
      await POST(
        request({ type: "confirm-progress", progressId }, "team-2"),
      )
    ).status,
  ).toBe(403);
  for (let index = 0; index < 2; index++) {
    expect(
      (await POST(request({ type: "confirm-progress", progressId }))).status,
    ).toBe(200);
  }
  expect(
    store.snapshot("business").progress.filter((p) => p.taskId === taskId),
  ).toHaveLength(1);
  expect(
    store.snapshot("business").teams.find((t) => t.id === "team-1")?.points,
  ).toBe(10);
});
