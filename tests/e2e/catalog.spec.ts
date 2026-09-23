import { expect, test, type Page } from "@playwright/test";
import type { Snapshot } from "../../src/domain/task";

function browserErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function switchProfile(page: Page, actor: string) {
  const select = page.getByLabel("Демопрофиль");
  if (!(await select.isVisible()))
    await page.getByLabel("Открыть профиль").click();
  await select.selectOption(actor);
  await expect(select).toHaveValue(actor);
  if (await select.isVisible())
    await page.getByLabel("Открыть профиль").click();
}

async function catalogIds(page: Page) {
  return page
    .getByRole("region", { name: "Результаты поиска" })
    .locator(".task-card")
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-task-id")),
    );
}

test("home search, categories and primary navigation lead to working pages", async ({
  page,
}) => {
  const errors = browserErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Опишите задачу.",
  );
  await expect(page.locator(".featured-grid .task-card")).toHaveCount(3);
  await page.getByLabel("Поиск задач на главной").fill("Bilim");
  await page.getByRole("button", { name: "Найти задачу", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog\?q=Bilim$/);
  await expect(page.getByLabel("Поиск задач", { exact: true })).toHaveValue(
    "Bilim",
  );
  await expect(
    page
      .getByRole("region", { name: "Результаты поиска" })
      .locator(".task-card"),
  ).toHaveCount(1);
  await expect(page.locator('[data-task-id="task-education"]')).toBeVisible();

  const navigation = page.getByRole("navigation", {
    name: "Основная навигация",
  });
  await navigation.getByRole("link", { name: "Главная", exact: true }).click();
  await page
    .locator(".category-grid")
    .getByRole("link", { name: /^Логистика/ })
    .click();
  await expect(page.locator('[data-task-id="task-delivery"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Логистика/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await navigation.getByRole("link", { name: "Команды", exact: true }).click();
  await expect(page.locator(".team-card")).toHaveCount(5);
  await navigation
    .getByRole("link", { name: "О платформе", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Из чего складывается рейтинг" }),
  ).toBeVisible();
  await navigation
    .getByRole("link", { name: "Разместить задачу", exact: true })
    .click();
  await expect(
    page.getByLabel("Описание задачи", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("catalog query, topic, readiness, format and sort update actual results", async ({
  page,
}) => {
  const errors = browserErrors(page);
  const response = await page.request.get("/api/demo", {
    headers: { "x-demo-actor": "business" },
  });
  const snapshot: Snapshot = await response.json();
  const published = snapshot.tasks.filter((task) => task.publishedAt);
  await page.goto("/catalog");
  const results = page.getByRole("region", { name: "Результаты поиска" });
  await expect(results.locator(".task-card")).toHaveCount(published.length);
  const scores = await results
    .locator(".mini-score > strong")
    .allTextContents();
  const numbers = scores.map((score) => Number.parseInt(score, 10));
  expect(numbers).toEqual([...numbers].sort((a, b) => b - a));

  await page.getByLabel("Поиск задач", { exact: true }).fill("Forma Studio");
  await page.getByLabel("Поиск задач", { exact: true }).press("Enter");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("Forma Studio");
  await expect(results.locator(".task-card")).toHaveCount(1);
  await expect(
    results.locator('[data-task-id="task-marketing"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Маркетинг/ }).click();
  await expect(
    page.getByRole("button", { name: /^Маркетинг/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Уровень готовности").selectOption("draft");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("level"))
    .toBe("draft");
  await page.getByLabel("Формат работы").selectOption("remote");
  await expect(
    results.locator('[data-task-id="task-marketing"]'),
  ).toBeVisible();
  await expect(results.locator(".mini-score > strong")).toHaveText("20/100");
  await page.getByLabel("Формат работы").selectOption("onsite");
  await expect(
    page.getByRole("heading", { name: "Задач по этим условиям нет" }),
  ).toBeVisible();
  await expect(results.locator(".task-card")).toHaveCount(0);
  await page
    .locator(".filter-panel")
    .getByRole("link", { name: "Сбросить", exact: true })
    .click();
  await expect(results.locator(".task-card")).toHaveCount(published.length);

  const oldest = [...published]
    .sort(
      (a, b) =>
        a.publishedAt!.localeCompare(b.publishedAt!) ||
        a.id.localeCompare(b.id),
    )
    .map((task) => task.id);
  const newest = [...published]
    .sort(
      (a, b) =>
        b.publishedAt!.localeCompare(a.publishedAt!) ||
        a.id.localeCompare(b.id),
    )
    .map((task) => task.id);
  await page.getByLabel("Сортировка").selectOption("newest");
  await expect.poll(() => catalogIds(page)).toEqual(newest);
  await page.getByLabel("Сортировка").selectOption("oldest");
  await expect.poll(() => catalogIds(page)).toEqual(oldest);
  await page.reload();
  await expect(page.getByLabel("Сортировка")).toHaveValue("oldest");
  await expect.poll(() => catalogIds(page)).toEqual(oldest);
  expect(errors).toEqual([]);
});

test("both catalog resets clear live search before the query is submitted", async ({
  page,
}) => {
  const errors = browserErrors(page);
  await page.goto("/catalog");
  const results = page.getByRole("region", { name: "Результаты поиска" });
  const search = page.getByLabel("Поиск задач", { exact: true });
  await expect(results.locator(".task-card").first()).toBeVisible();
  const initialIds = await catalogIds(page);

  await search.fill("zzzz-unmatched-live-query");
  await expect(results.locator(".task-card")).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
  await results
    .getByRole("link", { name: "Сбросить фильтры", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await expect.poll(() => catalogIds(page)).toEqual(initialIds);

  await search.fill("zzzz-another-live-query");
  await expect(results.locator(".task-card")).toHaveCount(0);
  await page
    .locator(".filter-panel")
    .getByRole("link", { name: "Сбросить", exact: true })
    .click();
  await expect(search).toHaveValue("");
  await expect.poll(() => catalogIds(page)).toEqual(initialIds);
  expect(errors).toEqual([]);
});

test("favorites persist per profile and can be removed from the saved list", async ({
  page,
}) => {
  const errors = browserErrors(page);
  await page.goto("/catalog");
  const results = page.getByRole("region", { name: "Результаты поиска" });
  const savedTask = results.locator('[data-task-id="task-inventory"]');
  await savedTask.getByRole("button", { name: /^Сохранить задачу:/ }).click();
  await expect(
    savedTask.getByRole("button", { name: /^Убрать из избранного:/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Избранное/ }).click();
  await expect(results.locator(".task-card")).toHaveCount(1);
  await page.reload();
  await expect(savedTask).toBeVisible();
  await expect(results.locator(".task-card")).toHaveCount(1);
  await expect(
    savedTask.getByRole("button", { name: /^Убрать из избранного:/ }),
  ).toHaveAttribute("aria-pressed", "true");

  await switchProfile(page, "team-5");
  await expect(
    page.getByRole("heading", { name: "В избранном пока нет таких задач" }),
  ).toBeVisible();
  await expect(results.locator(".task-card")).toHaveCount(0);
  await switchProfile(page, "business");
  await expect(savedTask).toBeVisible();
  await savedTask
    .getByRole("button", { name: /^Убрать из избранного:/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "В избранном пока нет таких задач" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "В избранном пока нет таких задач" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("preview opens the selected task and recommendations keep the whole catalog available", async ({
  page,
}) => {
  const errors = browserErrors(page);
  await page.goto("/catalog");
  const results = page.getByRole("region", { name: "Результаты поиска" });
  await expect(
    results.locator('[data-task-id="task-marketing"]'),
  ).toBeVisible();
  const allTaskIds = await catalogIds(page);
  const selected = results.locator('[data-task-id="task-inventory"]');
  await selected.getByRole("button", { name: /^Предпросмотр:/ }).click();
  const preview = page.getByRole("complementary", { name: "Быстрый просмотр" });
  await expect(
    preview.getByRole("heading", {
      name: "Объедините складские остатки в одном окне",
    }),
  ).toBeVisible();
  await expect(
    selected.getByRole("button", { name: /^Предпросмотр:/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await preview
    .getByRole("link", { name: "Открыть задачу", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tasks\/task-inventory$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Объедините складские остатки в одном окне",
  );
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Каталог задач", exact: true })
    .click();

  await switchProfile(page, "team-1");
  const recommended = page.getByRole("region", {
    name: "Рекомендовано вашей команде",
  });
  await expect(recommended).toBeVisible();
  await expect(recommended).toContainText("по интересам и навыкам");
  expect(await recommended.getByRole("link").count()).toBeGreaterThan(0);
  expect(await recommended.getByRole("link").count()).toBeLessThanOrEqual(2);
  await expect.poll(() => catalogIds(page)).toEqual(allTaskIds);
  await expect(
    results.locator('[data-task-id="task-marketing"]'),
  ).toBeVisible();
  await switchProfile(page, "team-5");
  await expect(recommended).toContainText("Arqa Tech");
  await expect.poll(() => catalogIds(page)).toEqual(allTaskIds);
  await results
    .locator('[data-task-id="task-marketing"]')
    .getByRole("heading")
    .getByRole("link")
    .click();
  await expect(
    page.getByRole("heading", { name: "Предложите своё решение" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
