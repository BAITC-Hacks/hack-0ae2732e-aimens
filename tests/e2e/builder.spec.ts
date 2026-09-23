import { expect, test } from "@playwright/test";

test("published task remains acknowledged when its snapshot refresh fails", async ({
  page,
}) => {
  await page.goto("/tasks/new");
  await page
    .getByLabel("Описание задачи", { exact: true })
    .fill("Хотим сократить списания выпечки в нашей кофейне.");
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await page
    .getByLabel("Название задачи")
    .fill("E2E: публикация при сбое обновления");
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page.getByRole("checkbox", { name: /Я проверил/ }).check();
  await page
    .getByRole("button", { name: "Подтвердить карточку", exact: true })
    .click();
  let writes = 0;
  await page.route("**/api/demo", async (route) => {
    if (route.request().method() === "POST") {
      writes += 1;
      return route.continue();
    }
    return route.fulfill({ status: 503, json: { error: "Снимок недоступен" } });
  });
  await page.getByRole("button", { name: "Опубликовать задачу" }).click();
  await expect(page).toHaveURL(/\/tasks\/[a-f0-9-]{36}$/);
  await expect(
    page.getByRole("heading", { name: "Нужно обновить данные" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Задача не найдена" }),
  ).toHaveCount(0);
  await page.unroute("**/api/demo");
  await page
    .getByRole("button", { name: "Обновить данные", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "E2E: публикация при сбое обновления" }),
  ).toBeVisible();
  expect(writes).toBe(1);
});

test("visited builder steps preserve answers without another analysis", async ({
  page,
}) => {
  let analyses = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/analyze")) analyses += 1;
  });
  await page.goto("/tasks/new");
  await page
    .getByLabel("Описание задачи", { exact: true })
    .fill("Кофейня хочет сократить списание непроданной выпечки вечером.");
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await page.getByLabel("Название задачи").fill("План выпечки на завтра");
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page.getByRole("checkbox", { name: /Я проверил/ }).check();
  await page
    .getByRole("button", { name: "Подтвердить карточку", exact: true })
    .click();
  const steps = page.getByRole("list", { name: "Этапы создания задачи" });
  await steps.getByRole("button", { name: /Черновик/ }).click();
  await page
    .getByLabel("Описание задачи", { exact: true })
    .fill(
      "Кофейня хочет сократить списание выпечки. Сейчас нет прогноза спроса.",
    );
  await steps.getByRole("button", { name: /Карточка/ }).click();
  await expect(page.getByLabel("Название задачи")).toHaveValue(
    "План выпечки на завтра",
  );
  await steps.getByRole("button", { name: /Публикация/ }).click();
  await expect(
    page.getByRole("checkbox", { name: /Я проверил/ }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Опубликовать задачу", exact: true }),
  ).toBeDisabled();
  expect(analyses).toBe(1);
});

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
  await page.getByLabel("Демопрофиль").selectOption("team-5");
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
