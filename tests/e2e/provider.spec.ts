import { expect, test, type Page } from "@playwright/test";
import { emptyCard } from "../../src/domain/task";

async function switchProfile(page: Page, actor: string) {
  const selector = page.getByLabel("Демопрофиль");
  if (!(await selector.isVisible()))
    await page.getByLabel("Открыть профиль", { exact: true }).click();
  await selector.selectOption(actor);
}

test("failed initial load can be retried without a stale error", async ({
  page,
}) => {
  await page.route("**/api/demo", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Данные временно недоступны" },
    }),
  );
  await page.goto("/catalog");
  await expect(
    page.getByRole("heading", { name: "Не удалось загрузить данные" }),
  ).toBeVisible();
  await page.unroute("**/api/demo");
  await page.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(page.locator(".task-card").first()).toBeVisible();
  await expect(page.locator('.toast[role="alert"]')).toHaveCount(0);
});

test("failed role switch never exposes the previous business snapshot", async ({
  page,
}) => {
  const title = `Приватный черновик provider ${Date.now()}`;
  const created = await page.request.post("/api/demo", {
    headers: { "x-demo-actor": "business" },
    data: {
      type: "save-task",
      card: { ...emptyCard, title },
      rawDescription: "Черновик существует только для проверки изоляции ролей.",
      confirmed: false,
      publish: false,
    },
  });
  expect(created.ok()).toBe(true);
  const { taskId } = await created.json();
  await page.goto(`/tasks/${taskId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await page.route("**/api/demo", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Не удалось загрузить профиль команды" },
    }),
  );
  await switchProfile(page, "team-2");
  await expect(
    page.getByRole("heading", { name: "Не удалось загрузить данные" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toHaveCount(0);
  await page.unroute("**/api/demo");
  await page.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Задача не найдена" }),
  ).toBeVisible();
  await expect(page.locator('.toast[role="alert"]')).toHaveCount(0);
});

test("successful proposal stays submitted when refresh fails and retry preserves new input", async ({
  page,
}) => {
  await page.goto("/tasks/task-marketing");
  await switchProfile(page, "team-5");
  await page
    .getByLabel("Идея решения")
    .fill("Provider regression: исследуем отзывы");
  await page
    .getByLabel("План работы")
    .fill("Собрать отзывы и проверить гипотезы");
  await page.getByLabel("Срок", { exact: false }).fill("2 недели");
  await page
    .getByLabel("Ссылка на прототип")
    .fill("https://example.com/provider-prototype");
  let mutations = 0;
  await page.route("**/api/demo", async (route) => {
    if (route.request().method() === "POST") {
      mutations += 1;
      await route.continue();
    } else {
      await route.fulfill({
        status: 503,
        json: { error: "Обновление недоступно" },
      });
    }
  });
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложение отправлено", exact: true }),
  ).toBeVisible();
  await expect(page.locator('.toast[role="alert"]')).toContainText("сохранено");
  await page.getByRole("button", { name: "Ещё одно предложение" }).click();
  await page.getByLabel("Идея решения").fill("Новый несохранённый вариант");
  await page.unroute("**/api/demo");
  await page
    .getByRole("button", { name: "Обновить данные", exact: true })
    .click();
  await expect(page.locator('.toast[role="alert"]')).toHaveCount(0);
  await expect(page.getByLabel("Идея решения")).toHaveValue(
    "Новый несохранённый вариант",
  );
  expect(mutations).toBe(1);
});

for (const delayedMethod of ["POST", "GET"] as const) {
  test(`late ${delayedMethod} response cannot navigate after business-team-business switching`, async ({
    page,
  }) => {
    await page.goto("/tasks/new");
    await page
      .getByLabel("Описание задачи", { exact: true })
      .fill("Задача для проверки смены профилей во время сохранения");
    let release!: () => void;
    const delayed = new Promise<void>((resolve) => {
      release = resolve;
    });
    let posted = false;
    let held = false;
    await page.route("**/api/demo", async (route) => {
      if (route.request().method() === "POST") {
        const response = await route.fetch();
        posted = true;
        if (delayedMethod === "POST") {
          held = true;
          await delayed;
        }
        return route.fulfill({ response });
      }
      if (delayedMethod === "GET" && posted && !held) {
        const response = await route.fetch();
        const staleSnapshot = await response.json();
        staleSnapshot.teams[0].name = "УСТАРЕВШИЙ ПРОФИЛЬ";
        held = true;
        await delayed;
        return route.fulfill({ response, json: staleSnapshot });
      }
      return route.continue();
    });
    try {
      await page
        .getByRole("button", { name: "Сохранить черновик", exact: true })
        .click();
      await expect.poll(() => held).toBe(true);
      await page
        .getByRole("navigation")
        .getByRole("link", { name: "Команды", exact: true })
        .click();
      await page
        .locator(".team-card")
        .first()
        .getByRole("button", { name: "Выбрать профиль" })
        .click();
      await expect(
        page.getByRole("heading", { name: "Мои отклики", exact: true }),
      ).toBeVisible();
      await switchProfile(page, "business");
      await expect(
        page.getByRole("heading", { name: "Выберите свою команду" }),
      ).toBeVisible();
      const delivered = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/demo") &&
          response.request().method() === delayedMethod,
      );
      release();
      await (await delivered).finished();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
      await expect(page.locator('.toast[role="status"]')).toHaveCount(0);
      await expect(
        page.getByText("УСТАРЕВШИЙ ПРОФИЛЬ", { exact: true }),
      ).toHaveCount(0);
      await expect(page).toHaveURL(/\/team$/);
      // A navigation triggered by the late save response must not replace this screen.
      await page.getByRole("button", { name: /Nomad Labs/ }).click();
      await expect(
        page.getByRole("heading", { name: "Мои отклики", exact: true }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/team$/);
    } finally {
      release();
    }
  });
}
