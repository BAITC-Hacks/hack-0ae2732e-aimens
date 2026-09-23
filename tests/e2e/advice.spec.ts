import { expect, test } from "@playwright/test";

test("local topic and optional advice leave canonical readiness unchanged", async ({
  page,
}) => {
  const description =
    "Курьерская служба тратит много времени на маршруты доставки по городу.";
  await page.goto("/tasks/new");
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  const [topicResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith("/api/suggest-topic"),
    ),
    page
      .getByRole("button", { name: "Не знаю тему — определить по описанию" })
      .click(),
  ]);
  expect(topicResponse.ok()).toBe(true);
  expect(await topicResponse.json()).toMatchObject({
    topic: "Логистика",
    mode: "local",
  });
  await expect(
    page.getByRole("combobox", { name: "Тема", exact: true }),
  ).toHaveValue("Логистика");
  await expect(
    page.getByRole("status").filter({ hasText: "Локальный подбор." }),
  ).toContainText("Логистика");

  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await page.getByLabel("Название задачи").fill("E2E: маршруты курьеров");
  await page.getByLabel("Что происходит сейчас").fill(description);
  await page
    .getByLabel("Что нужно изменить")
    .fill("Сократить время планирования маршрутов курьеров");
  await page
    .getByLabel("Ожидаемый результат")
    .fill("Прототип планирования ежедневных маршрутов");
  // An incomplete source may lower the separate advice, but never readiness.
  await page.getByLabel("Исходное описание").fill("Маршруты курьеров");
  const readiness = page.getByRole("progressbar", {
    name: "Готовность задачи",
  });
  await expect(readiness).toHaveAttribute("aria-valuenow", "35");
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  const advice = page.getByRole("region", { name: "Рекомендации по задаче" });
  const [reviewResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith("/api/review-task"),
    ),
    advice.getByRole("button", { name: "Анализ задачи", exact: true }).click(),
  ]);
  expect(reviewResponse.ok()).toBe(true);
  const review = await reviewResponse.json();
  expect(review.assessment.mode).toBe("local");
  expect(review.assessment.score).toBeLessThanOrEqual(20);
  await expect(
    advice.getByText("Локальная оценка", { exact: true }),
  ).toBeVisible();
  await expect(advice.getByRole("status")).toContainText(
    `${review.assessment.score} / 100 баллов`,
  );
  await expect(readiness).toHaveAttribute("aria-valuenow", "35");
  await page
    .getByRole("button", { name: "Редактировать карточку", exact: true })
    .click();
  await expect(page.getByLabel("Что происходит сейчас")).toHaveValue(
    description,
  );
  await expect(
    page.getByRole("combobox", { name: "Тема *", exact: true }),
  ).toHaveValue("Логистика");
});

test("malformed optional advice preserves answers and allows manual confirmation", async ({
  page,
}) => {
  const description =
    "Курьерской службе нужен понятный план маршрутов на каждый день.";
  await page.goto("/tasks/new");
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await page
    .getByLabel("Название задачи")
    .fill("E2E: сохранение при ошибке рекомендаций");
  await page.getByLabel("Что происходит сейчас").fill(description);
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page.route("**/api/review-task", (route) =>
    route.fulfill({
      status: 200,
      json: {
        assessment: { score: 100 },
        reviewToken: "00000000-0000-4000-8000-000000000000",
      },
    }),
  );
  await page
    .getByRole("button", { name: "Анализ задачи", exact: true })
    .click();
  await expect(page.locator(".form-error[role=alert]")).toContainText(
    "Получен некорректный ответ. Ввод сохранён",
  );
  await expect(
    page.getByRole("progressbar", { name: "Готовность задачи" }),
  ).toHaveAttribute("aria-valuenow", "10");
  await page
    .getByRole("button", { name: "Редактировать карточку", exact: true })
    .click();
  await expect(page.getByLabel("Название задачи")).toHaveValue(
    "E2E: сохранение при ошибке рекомендаций",
  );
  await expect(page.getByLabel("Исходное описание")).toHaveValue(description);
  await expect(page.getByLabel("Что происходит сейчас")).toHaveValue(
    description,
  );
  await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
  await page.getByRole("checkbox", { name: /Я проверил/ }).check();
  await page
    .getByRole("button", { name: "Подтвердить карточку", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Опубликовать задачу", exact: true }),
  ).toBeEnabled();
});
