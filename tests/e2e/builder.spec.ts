import { expect, test } from "@playwright/test";

test("business edits and publishes a seeded draft hidden from teams", async ({
  page,
}) => {
  const before = await (
    await page.request.get("/api/demo", {
      headers: { "x-demo-actor": "team-2" },
    })
  ).json();
  expect(
    before.tasks.some((t: { id: string }) => t.id === "draft-inventory"),
  ).toBe(false);
  await page.goto("/business");
  await page
    .getByRole("link", { name: "Редактировать: Учёт на складе", exact: true })
    .click();
  await expect(page.getByLabel("Исходное описание")).toContainText(
    "Магазин ведёт остатки",
  );
  await page
    .getByLabel("Название задачи")
    .fill("E2E: опубликованный пример склада");
  await page
    .getByLabel("Исходное описание")
    .fill("Магазин ведёт остатки в таблице, нужна единая форма.");
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page.getByRole("checkbox", { name: /Я проверил/ }).check();
  await page
    .getByRole("button", { name: "Подтвердить карточку", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Опубликовать задачу", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "E2E: опубликованный пример склада",
      exact: true,
    }),
  ).toBeVisible();
  const after = await (
    await page.request.get("/api/demo", {
      headers: { "x-demo-actor": "team-2" },
    })
  ).json();
  expect(
    after.tasks.find((t: { id: string }) => t.id === "draft-inventory")
      .publishedAt,
  ).toBeTruthy();
});

test("builder saves an unfinished description as a draft", async ({ page }) => {
  await page.goto("/tasks/new");
  const description = `Черновик ${Date.now()}: хотим понять причины оттока клиентов.`;
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page
    .getByRole("button", { name: "Сохранить черновик", exact: true })
    .click();
  await expect(page).toHaveURL(/\/business$/);
  const response = await page.request.get("/api/demo", {
    headers: { "x-demo-actor": "business" },
  });
  const snapshot = await response.json();
  const saved = snapshot.tasks.find(
    (task: { rawDescription: string }) => task.rawDescription === description,
  );
  expect(saved).toBeDefined();
  expect(saved.publishedAt).toBeNull();
  expect(saved.confirmedAt).toBeNull();
});

test("builder keeps input after an analysis error and can retry", async ({
  page,
}) => {
  await page.goto("/tasks/new");
  const description =
    "Нужен простой способ собирать пожелания посетителей кофейни.";
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Анализ временно недоступен" }),
    }),
  );
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Анализ временно недоступен",
  );
  await expect(page.getByLabel("Описание задачи", { exact: true })).toHaveValue(
    description,
  );
  await page.unroute("**/api/analyze");
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await expect(
    page.getByRole("heading", { name: "Уточним самое важное" }),
  ).toBeVisible();
  expect(await page.locator(".field textarea").count()).toBeGreaterThanOrEqual(
    3,
  );
});

test("preview needs confirmation and permits publication at low readiness", async ({
  page,
}) => {
  await page.goto("/tasks/new");
  await page
    .getByLabel("Описание задачи", { exact: true })
    .fill("Хотим лучше понимать пожелания посетителей нашего магазина.");
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await page.getByLabel("Название задачи").fill("");
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page
    .getByRole("button", { name: "Анализ задачи" })
    .click();
  await expect(page.getByText(/\/ 100 баллов/)).toBeVisible();
  await page.getByRole("checkbox", { name: /Я проверил/ }).check();
  await page
    .getByRole("button", { name: "Подтвердить карточку", exact: true })
    .click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Укажите название и тему задачи",
  );
  await expect(
    page.getByRole("button", { name: "Опубликовать задачу", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Редактировать карточку", exact: true })
    .click();
  const title = `E2E: задача с низким рейтингом ${Date.now()}`;
  await page.getByLabel("Название задачи").fill(title);
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page
    .getByRole("button", { name: "Анализ задачи" })
    .click();
  await expect(page.getByText(/\/ 100 баллов/)).toBeVisible();
  await page.getByRole("checkbox", { name: /Я проверил/ }).check();
  await page
    .getByRole("button", { name: "Подтвердить карточку", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Карточка подтверждена" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Редактировать карточку", exact: true })
    .click();
  await page
    .getByLabel("Исходное описание")
    .fill(
      "Хотим лучше понимать пожелания посетителей магазина. Сейчас читаем отзывы вручную.",
    );
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page
    .getByRole("button", { name: "Анализ задачи" })
    .click();
  await expect(page.getByText(/\/ 100 баллов/)).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Я проверил/ }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Опубликовать задачу", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: /Я проверил/ }).check();
  await page
    .getByRole("button", { name: "Подтвердить карточку", exact: true })
    .click();
  const readiness = Number(
    await page
      .getByRole("progressbar", { name: "Готовность задачи" })
      .getAttribute("aria-valuenow"),
  );
  expect(readiness).toBeLessThan(40);
  await page
    .getByRole("button", { name: "Опубликовать задачу", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page.getByLabel("Открыть профиль", { exact: true }).click();
  await page.getByRole("button", { name: "Команда", exact: true }).click();
  await page.getByLabel("Команда в профиле").selectOption("team-5");
  await page.getByLabel("Открыть профиль", { exact: true }).click();
  await expect(page.getByLabel("Идея решения")).toBeVisible();
  await page
    .getByLabel("Идея решения")
    .fill("Соберём и сгруппируем пожелания посетителей");
  await page
    .getByLabel("План работы")
    .fill("Интервью, прототип формы, проверка с бизнесом");
  await page.getByLabel("Срок", { exact: false }).fill("Одна неделя");
  await page
    .getByLabel("Ссылка на прототип")
    .fill("https://example.com/low-score-prototype");
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложение отправлено" }),
  ).toBeVisible();
});
