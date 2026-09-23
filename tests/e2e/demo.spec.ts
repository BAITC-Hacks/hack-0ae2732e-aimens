import { test, expect } from "@playwright/test";

test("mobile navigation stays named and the catalog does not overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", {
    name: "Основная навигация",
  });
  await expect(
    navigation.getByRole("link", { name: "Каталог задач" }),
  ).toBeVisible();
  await expect(navigation.getByText("Каталог", { exact: true })).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Как это работает" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "К содержимому" })).toBeFocused();
  await expect(page.getByRole("link", { name: "К содержимому" })).toHaveCSS(
    "outline-width",
    "3px",
  );
  await page.setViewportSize({ width: 1030, height: 714 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(1030);
});

test("business and a team complete the whole workflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("link", { name: "Предложить задачу", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Описание задачи" })
    .fill(
      "В нашей сети кофеен каждый вечер остаётся выпечка. Хотим сократить списания.",
    );
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await expect(
    page.getByText("Локальный помощник.", { exact: false }),
  ).toBeVisible();
  const questions = page.locator(".field textarea");
  expect(await questions.count()).toBeGreaterThanOrEqual(3);
  await questions.first().fill("Снизить объём списаний");
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await page.getByLabel("Название задачи").fill("E2E: прогноз выпечки");
  await page
    .getByLabel("Что происходит сейчас")
    .fill("Каждый вечер кофейня списывает непроданную выпечку.");
  await page
    .getByLabel("Что нужно изменить")
    .fill("Точнее планировать производство на следующий день.");
  await page.getByLabel("Для кого решение").fill("Управляющие кофейнями");
  await page
    .getByLabel("Данные и материалы")
    .fill("Таблица продаж за три месяца");
  await page.getByLabel("Доступ к данным").selectOption("provided");
  await page
    .getByLabel("Ожидаемый результат")
    .fill("Прототип расчёта объёма выпечки");
  await page.getByLabel("Показатель успеха").fill("Доля списаний");
  await page.getByLabel("Целевое значение").fill("Снижение на 20%");
  await page.getByLabel("Ограничения").fill("Только синтетические данные");
  await page.getByLabel("Контакт бизнеса").fill("demo@example.com");
  await page
    .getByLabel("Как будем взаимодействовать")
    .fill("Созвон раз в неделю");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await expect(
    page.getByRole("button", { name: "Опубликовать задачу" }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Опубликовать задачу" }).click();
  await expect(
    page.getByRole("heading", { name: "E2E: прогноз выпечки" }),
  ).toBeVisible();
  const taskUrl = page.url();

  // Edits have no public effect until the business confirms them.
  await page.getByRole("link", { name: "Редактировать", exact: true }).click();
  await page.getByLabel("Данные и материалы").fill("");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "80",
  );
  await page.getByRole("link", { name: "К задаче", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );

  await page.getByLabel("Демопрофиль").selectOption("team-1");
  await page.getByLabel("Идея решения").fill("Прогноз спроса на основе продаж");
  await page
    .getByLabel("План работы")
    .fill("Проверить данные, построить базовый прогноз, показать прототип");
  await page.getByLabel("Срок", { exact: false }).fill("2 недели");
  await page
    .getByLabel("Ссылка на прототип")
    .fill("https://example.com/prototype");
  await page
    .getByRole("button", { name: "Отправить предложение", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложение отправлено" }),
  ).toBeVisible();
  await page.getByLabel("Демопрофиль").selectOption("business");
  await page
    .getByRole("button", { name: "Выбрать команду", exact: true })
    .click();
  await expect(
    page.getByText("Команда выбрана", { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Демопрофиль").selectOption("team-1");
  await page
    .getByLabel("Что сделано")
    .fill("Подготовлен первый прогноз на синтетических данных");
  await page
    .getByLabel("Ссылка на результат")
    .fill("https://example.com/result");
  await page
    .getByRole("button", { name: "Отправить результат", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Первый результат на проверке" }),
  ).toBeVisible();
  await page.getByLabel("Демопрофиль").selectOption("business");
  await page
    .getByRole("button", { name: "Подтвердить результат · +10" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Первый результат подтверждён" }),
  ).toBeVisible();
  await page.getByLabel("Демопрофиль").selectOption("team-1");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Мои отклики" })
    .click();
  await expect(page.getByTestId("team-points")).toHaveText("10");
  await page.goto(taskUrl);
  await expect(
    page.getByRole("heading", { name: "Первый результат подтверждён" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("all pages work and catalog filters do not restrict team access", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".task-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Маркетинг", exact: true }).click();
  await page.getByLabel("Уровень готовности").selectOption("draft");
  await expect(page.locator(".task-card")).toHaveCount(1);
  await expect(page.locator(".task-card")).toContainText("20");
  await page.getByLabel("Демопрофиль").selectOption("team-5");
  await expect(page.locator(".task-card")).toHaveCount(1);
  await page
    .getByRole("link", {
      name: "Найдите главное в отзывах клиентов",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложите своё решение" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Мои отклики" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Мои отклики", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Команды", exact: true })
    .click();
  await expect(page.locator(".team-card")).toHaveCount(5);
  await page.getByRole("link", { name: "Как это работает" }).click();
  await expect(
    page.getByRole("heading", { name: "Из чего складывается рейтинг" }),
  ).toBeVisible();
  await page.getByLabel("Демопрофиль").selectOption("business");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Мои задачи и отклики" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Кабинет бизнеса" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Предложения/ }).click();
  await expect(page.locator(".proposal-card").first()).toBeVisible();
  await page.getByRole("button", { name: /^Результаты/ }).click();
  await expect(
    page.getByText("За подтверждённый первый результат", { exact: false }),
  ).toBeVisible();
});
