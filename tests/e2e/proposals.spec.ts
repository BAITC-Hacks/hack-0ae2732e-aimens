import { expect, test } from "@playwright/test";
import { emptyCard } from "../../src/domain/task";

test("business compares proposals and independently selects two teams", async ({
  page,
}) => {
  const taskResponse = await page.request.post("/api/demo", {
    headers: { "x-demo-actor": "business" },
    data: {
      type: "save-task",
      card: {
        ...emptyCard,
        title: "E2E: сравнение подходов команд",
        topic: "Маркетинг",
        workFormat: "hybrid",
        skills: ["Python", "Аналитика"],
      },
      rawDescription: "Хотим быстрее понимать обратную связь клиентов.",
      confirmed: true,
      publish: true,
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
