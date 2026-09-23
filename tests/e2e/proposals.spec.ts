import { expect, test } from "@playwright/test";
import { emptyCard } from "../../src/domain/task";

test("one result row and one reward for two selected proposals from the same team", async ({
  page,
}) => {
  const act = async (actor: string, data: object) => {
    const response = await page.request.post("/api/demo", {
      headers: { "x-demo-actor": actor },
      data,
    });
    expect(response.ok()).toBeTruthy();
    return response.json();
  };
  const { taskId } = await act("business", {
    type: "save-task",
    card: { ...emptyCard, title: "E2E: один результат команды" },
    rawDescription: "Проверим первый результат команды",
    confirmed: true,
    publish: true,
  });
  for (let i = 0; i < 2; i++) {
    const { proposalId } = await act("team-4", {
      type: "propose",
      taskId,
      idea: `Подход ${i}`,
      plan: "Собрать прототип",
      duration: "1 день",
      link: "https://example.com/prototype",
    });
    await act("business", { type: "decide", proposalId, status: "selected" });
  }
  const { progressId } = await act("team-4", {
    type: "submit-progress",
    taskId,
    description: "Единственный первый результат",
    link: "https://example.com/result",
  });
  await page.goto("/business");
  await page.getByRole("button", { name: /^Результаты/ }).click();
  const rows = page
    .locator(".proposal-card")
    .filter({ hasText: "Единственный первый результат" });
  await expect(rows).toHaveCount(1);
  await rows.getByRole("button", { name: /Подтвердить/ }).click();
  await expect(rows).toContainText("+10");
  await act("business", { type: "confirm-progress", progressId });
  const snapshot = await (
    await page.request.get("/api/demo", {
      headers: { "x-demo-actor": "business" },
    })
  ).json();
  expect(
    snapshot.progress.filter((p: { taskId: string }) => p.taskId === taskId),
  ).toHaveLength(1);
  expect(
    snapshot.teams.find((t: { id: string }) => t.id === "team-4").points,
  ).toBe(10);
});

test("business compares proposals and independently selects two teams", async ({
  page,
}) => {
  const card = {
    ...emptyCard,
    title: "E2E: сравнение подходов команд",
    topic: "Маркетинг",
    workFormat: "hybrid" as const,
    skills: ["Python", "Аналитика"],
  };
  const rawDescription = "Хотим быстрее понимать обратную связь клиентов.";
  const reviewResponse = await page.request.post("/api/review-task", {
    data: { rawDescription, card },
  });
  expect(reviewResponse.ok()).toBeTruthy();
  const { reviewToken } = await reviewResponse.json();
  const taskResponse = await page.request.post("/api/demo", {
    headers: { "x-demo-actor": "business" },
    data: {
      type: "save-task",
      card,
      rawDescription,
      confirmed: true,
      publish: true,
      reviewToken,
    },
  });
  expect(taskResponse.ok()).toBeTruthy();
  const { taskId } = await taskResponse.json();
  for (const [index, actor] of ["team-1", "team-2", "team-3"].entries()) {
    const response = await page.request.post("/api/demo", {
      headers: { "x-demo-actor": actor },
      data: {
        type: "propose",
        taskId,
        idea: `Подход ${index + 1}: изучим обратную связь`,
        plan: `План ${index + 1}: исследование, прототип, проверка`,
        duration: `${index + 1} недели`,
        link: `https://example.com/prototype-${index + 1}`,
      },
    });
    expect(response.ok()).toBeTruthy();
  }

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`/tasks/${taskId}`);
  await expect(
    page.getByRole("heading", { name: "E2E: сравнение подходов команд" }),
  ).toBeVisible();
  await expect(page.locator(".detail-heading")).toContainText(
    "Гибридный формат",
  );
  await expect(page.locator(".task-skills")).toContainText("Python");
  await page.getByText("Исходное описание бизнеса", { exact: true }).click();
  await expect(page.locator(".task-source")).toContainText(
    "Хотим быстрее понимать обратную связь клиентов.",
  );

  await page.getByRole("button", { name: "Сравнить предложения" }).click();
  const comparison = page.getByRole("region", {
    name: "Сравнение предложений",
  });
  await expect(comparison.getByRole("table")).toBeVisible();
  await expect(comparison).toContainText("Sana Tech · демовуз");
  await expect(comparison).toContainText(
    "План 2: исследование, прототип, проверка",
  );
  await comparison
    .getByRole("button", { name: "Выбрать команду", exact: true })
    .first()
    .click();
  await expect(
    comparison.getByText("Команда выбрана", { exact: true }),
  ).toHaveCount(1);
  await comparison
    .getByRole("button", { name: "Выбрать команду", exact: true })
    .first()
    .click();
  await expect(
    comparison.getByText("Команда выбрана", { exact: true }),
  ).toHaveCount(2);
  await comparison
    .getByRole("button", { name: "Отклонить", exact: true })
    .click();
  await expect(comparison.getByText("Отклонено", { exact: true })).toHaveCount(
    1,
  );

  await page.getByRole("button", { name: "Показать карточки" }).click();
  await expect(page.locator(".proposal-card")).toHaveCount(3);
  await page
    .locator(".proposal-card")
    .first()
    .getByText("План и информация о команде", { exact: true })
    .click();
  await expect(
    page.locator(".proposal-card").first().locator("details"),
  ).toHaveAttribute("open", "");
  const snapshotResponse = await page.request.get("/api/demo", {
    headers: { "x-demo-actor": "business" },
  });
  const snapshot = await snapshotResponse.json();
  expect(
    snapshot.proposals.filter(
      (proposal: { taskId: string; status: string }) =>
        proposal.taskId === taskId && proposal.status === "selected",
    ),
  ).toHaveLength(2);
  await page
    .getByRole("link", { name: "Каталог задач", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/\/catalog$/);
  expect(errors).toEqual([]);
});
