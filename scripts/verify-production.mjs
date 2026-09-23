import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// A real production process restart; all writes go to a new disposable database.
const directory = mkdtempSync(join(tmpdir(), "sanalink-production-"));
const database = join(directory, "demo.sqlite");
const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const port = socket.address().port;
await new Promise((done) => socket.close(done));
const origin = `http://127.0.0.1:${port}`;
let child;

async function start() {
  child = spawn(
    process.execPath,
    [
      resolve("node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      env: {
        ...process.env,
        AI_MODE: "local",
        OPENAI_API_KEY: "",
        DATABASE_PATH: database,
        NEXT_DIST_DIR: ".next",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output = (output + chunk).slice(-4000);
  });
  child.stderr.on("data", (chunk) => {
    output = (output + chunk).slice(-4000);
  });
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null)
      throw new Error(`Production server exited: ${output}`);
    try {
      const response = await fetch(`${origin}/api/demo`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return;
    } catch {
      /* Wait for the server to bind its port. */
    }
    await delay(250);
  }
  throw new Error(`Production server did not start: ${output}`);
}

async function stop() {
  if (child && child.exitCode === null) {
    const closed = once(child, "close");
    child.kill();
    await closed;
  }
}

async function request(path, actor = "business", body) {
  const response = await fetch(`${origin}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "x-demo-actor": actor },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  return data;
}

try {
  await start();
  const initial = await request("/api/demo");
  assert.equal(initial.tasks.filter((task) => !task.publishedAt).length, 5);
  assert.equal(initial.tasks.filter((task) => task.publishedAt).length, 5);
  const card = {
    ...initial.tasks.find((task) => task.id === "task-coffee").card,
    title: "Проверка production: выпечка",
  };
  const analysis = await request("/api/analyze", "business", {
    description:
      "Каждый вечер кофейня списывает выпечку. Хотим сократить списания.",
    card,
  });
  assert.equal(analysis.mode, "local");
  assert.ok(analysis.questions.length >= 3 && analysis.questions.length <= 5);
  const { taskId } = await request("/api/demo", "business", {
    type: "save-task",
    card,
    rawDescription: "Синтетическая проверка сохранения выпечки",
    confirmed: true,
    publish: true,
  });
  // Publishing and proposing remain available with zero readiness and no AI review.
  const lowScoreCard = {
    ...initial.tasks.find((task) => !task.publishedAt).card,
    title: "Задача с нулевой готовностью",
  };
  const { taskId: lowScoreTaskId } = await request("/api/demo", "business", {
    type: "save-task",
    card: lowScoreCard,
    rawDescription: "",
    confirmed: true,
    publish: true,
  });
  await request("/api/demo", "team-2", {
    type: "propose",
    taskId: lowScoreTaskId,
    idea: "Поможем уточнить задачу",
    plan: "Уточним потребность и соберём прототип",
    duration: "Две недели",
    link: "https://example.com/low-score",
  });

  // The review and save routes must share tickets in the real production process.
  // A weak source yields lower advisory scores without lowering confirmed readiness.
  const reviewedCard = {
    ...card,
    title: "Задача с необязательными рекомендациями",
  };
  const reviewedRaw = "Короткий текст";
  const review = await request("/api/review-task", "business", {
    rawDescription: reviewedRaw,
    card: reviewedCard,
  });
  assert.equal(review.assessment.mode, "local");
  assert.ok(review.assessment.score <= 20);
  const { taskId: reviewedTaskId } = await request("/api/demo", "business", {
    type: "save-task",
    card: reviewedCard,
    rawDescription: reviewedRaw,
    confirmed: true,
    publish: true,
    reviewToken: review.reviewToken,
  });
  const publishedTasks = (await request("/api/demo", "team-1")).tasks;
  assert.equal(
    publishedTasks.find((task) => task.id === lowScoreTaskId).readiness.score,
    0,
  );
  const reviewedTask = publishedTasks.find(
    (task) => task.id === reviewedTaskId,
  );
  assert.deepEqual(reviewedTask.qualityAssessment, review.assessment);
  assert.equal(reviewedTask.readiness.score, 100);
  assert.deepEqual(reviewedTask.readiness, analysis.preliminaryReadiness);
  const { proposalId } = await request("/api/demo", "team-1", {
    type: "propose",
    taskId,
    idea: "Прогноз спроса",
    plan: "Данные, прогноз, прототип",
    duration: "Две недели",
    link: "https://example.com/prototype",
  });
  await request("/api/demo", "business", {
    type: "decide",
    proposalId,
    status: "selected",
  });
  const { progressId } = await request("/api/demo", "team-1", {
    type: "submit-progress",
    taskId,
    description: "Первый прогноз на синтетических данных",
    link: "https://example.com/result",
  });
  await request("/api/demo", "business", {
    type: "confirm-progress",
    progressId,
  });
  const before = await request("/api/demo");
  assert.equal(before.teams.find((team) => team.id === "team-1").points, 10);
  await stop();
  await start();
  assert.deepEqual(await request("/api/demo"), before);
  await request("/api/demo", "business", {
    type: "confirm-progress",
    progressId,
  });
  assert.deepEqual(await request("/api/demo"), before);
  console.log(
    "PASS: production without a key, low-score publication and proposal, optional advice without rating changes, full workflow, process restart, unchanged SQLite data, exactly 10 points.",
  );
  console.log(`Temporary evidence database: ${database}`);
} finally {
  await stop();
}
