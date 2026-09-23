import { expect, test } from "@playwright/test";
import type { Snapshot } from "../../src/domain/task";

test("created team stays selected and can propose when the previous profile refresh fails", async ({
  page,
}) => {
  const teamName = `E2E Qadam ${Date.now()}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const initialLoad = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/demo") &&
      response.request().method() === "GET",
  );
  await page.goto("/teams/new");
  expect((await initialLoad).ok()).toBe(true);
  await page.getByLabel("Название команды").fill(teamName);
  await page.getByRole("checkbox", { name: "Маркетинг" }).check();
  await page.getByRole("button", { name: "Тулпар", exact: true }).click();

  let teamCreations = 0;
  await page.route("**/api/demo", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      if (request.postDataJSON().type === "create-team") teamCreations += 1;
      return route.continue();
    }
    if (request.headers()["x-demo-actor"] === "business") {
      return route.fulfill({
        status: 503,
        json: { error: "Не удалось обновить прежний профиль" },
      });
    }
    return route.continue();
  });
  await page
    .getByRole("button", { name: "Создать команду", exact: true })
    .click();
  await expect(page).toHaveURL(/\/team$/);
  await expect(page.locator(".page-heading")).toContainText(teamName);
  await expect(page.getByTestId("team-points")).toHaveText("0");
  await expect(page.locator('.toast[role="alert"]')).toHaveCount(0);
  expect(teamCreations).toBe(1);
  await page.unroute("**/api/demo");

  // The custom UUID must survive a full reload, not only client navigation.
  await page.reload();
  await expect(page.locator(".page-heading")).toContainText(teamName);
  await page.getByLabel("Открыть профиль", { exact: true }).click();
  const profileSelector = page.getByLabel("Команда в профиле");
  const profileMenu = page.locator(".profile-menu");
  const teamId = await profileSelector.inputValue();
  expect(teamId).toMatch(/^team-[0-9a-f-]{36}$/u);
  await profileMenu
    .getByRole("button", { name: "Бизнес", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Выберите свою команду" }),
  ).toBeVisible();
  await profileMenu
    .getByRole("button", { name: "Команда", exact: true })
    .click();
  await expect(profileSelector).toHaveValue(teamId);
  await expect(page.locator(".page-heading")).toContainText(teamName);
  await page.getByLabel("Открыть профиль", { exact: true }).click();

  await page.goto("/tasks/task-marketing");
  await expect(page.locator("#proposal")).toContainText(teamName);
  await page.getByLabel("Идея решения").fill("Сгруппируем отзывы клиентов");
  await page
    .getByLabel("План работы")
    .fill("Изучим отзывы и проверим прототип");
  await page.getByLabel("Срок", { exact: false }).fill("1 неделя");
  await page
    .getByLabel("Ссылка на прототип")
    .fill("https://example.com/custom-team-prototype");
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложение отправлено", exact: true }),
  ).toBeVisible();

  const response = await page.request.get("/api/demo", {
    headers: { "x-demo-actor": teamId },
  });
  expect(response.ok()).toBe(true);
  const snapshot: Snapshot = await response.json();
  expect(snapshot.teams.find((team) => team.id === teamId)).toMatchObject({
    name: teamName,
    interests: ["Маркетинг"],
    iconKey: "tulpar",
    points: 0,
  });
  expect(
    snapshot.proposals.filter(
      (proposal) =>
        proposal.teamId === teamId && proposal.taskId === "task-marketing",
    ),
  ).toEqual([
    expect.objectContaining({
      idea: "Сгруппируем отзывы клиентов",
      status: "pending",
    }),
  ]);
  expect(errors).toEqual([]);
});
