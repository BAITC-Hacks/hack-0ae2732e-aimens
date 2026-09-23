import { expect, test } from "@playwright/test";

const description = "Кофейня списывает выпечку вечером. Нужен прогноз спроса.";
const analysis = {
  mode: "openai",
  message: "AI-помощник проанализировал описание.",
  suggestions: {
    context: "Кофейня списывает выпечку вечером.",
    need: "Нужен прогноз спроса.",
  },
  sources: { context: description, need: description },
  missingFields: ["users", "constraints", "expectedResult"],
  questions: [
    { field: "users", question: "Кому нужен прогноз спроса?" },
    { field: "constraints", question: "Какие ограничения у задачи?" },
    { field: "expectedResult", question: "Что ожидаете от команды?" },
  ],
};

test("questions AI button fills answers, preserves edits and explains local fallback", async ({ page }) => {
  const result = {
    ...analysis,
    suggestions: { expectedResult: "прогноз спроса" },
    sources: { expectedResult: description },
  };
  await page.route("**/api/analyze", (route) => route.fulfill({ json: result }));
  await page.goto("/tasks/new");
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await page.getByLabel("Что ожидаете от команды?").fill("");
  await page.getByLabel("Кому нужен прогноз спроса?").fill("Управляющий");
  const fill = page.getByRole("button", { name: "Заполнить с ИИ", exact: true });
  await fill.click();
  await expect(page.getByLabel("Что ожидаете от команды?")).toHaveValue("прогноз спроса");
  await expect(page.getByLabel("Кому нужен прогноз спроса?")).toHaveValue("Управляющий");
  await expect(page.getByRole("status")).toContainText("Заполнено полей: 1");
  await page.getByLabel("Что ожидаете от команды?").fill("Мой результат");
  await page.unroute("**/api/analyze");
  await fill.click();
  await expect(page.getByRole("status")).toContainText("Локальный режим: ИИ недоступен");
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await expect(page.getByLabel("Ожидаемый результат")).toHaveValue("Мой результат");
  await expect(page.getByLabel("Для кого решение")).toHaveValue("Управляющий");
});

test("AI fills cited fields automatically and answers stay editable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ json: analysis }),
  );
  await page.goto("/tasks/new");
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await expect(
    page.getByText("Анализ через OpenAI API", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await expect(page.getByLabel("Что происходит сейчас")).toHaveValue(
    analysis.suggestions.context,
  );
  await expect(page.getByLabel("Что нужно изменить")).toHaveValue(
    analysis.suggestions.need,
  );
  await expect(page.getByLabel("Контакт бизнеса")).toHaveValue("");
  await page
    .getByRole("list", { name: "Этапы создания задачи" })
    .getByRole("button", { name: /Уточнение/ })
    .click();
  await page
    .getByRole("button", {
      name: "Убрать: Что нужно изменить",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Кому нужен прогноз спроса?")
    .fill("Управляющий пекарней");
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await expect(page.getByLabel("Что происходит сейчас")).toHaveValue(
    analysis.suggestions.context,
  );
  await expect(page.getByLabel("Что нужно изменить")).toHaveValue("");
  await expect(page.getByLabel("Для кого решение")).toHaveValue(
    "Управляющий пекарней",
  );
  await page
    .getByLabel("Что происходит сейчас")
    .fill("Исправленный контекст бизнеса");
  await page.getByRole("button", { name: "Повторно уточнить с AI" }).click();
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await expect(page.getByLabel("Что происходит сейчас")).toHaveValue(
    "Исправленный контекст бизнеса",
  );
  await expect(page.getByLabel("Для кого решение")).toHaveValue(
    "Управляющий пекарней",
  );
  expect(errors).toEqual([]);
});

test("inline AI button fills only its field and keeps the card editable", async ({
  page,
}) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ json: analysis }),
  );
  await page.goto("/tasks/new");
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await page.getByRole("button", { name: "Перейти к карточке" }).click();
  await page.getByLabel("Что происходит сейчас").fill("");
  await page.getByLabel("Что нужно изменить").fill("");
  await page
    .getByRole("button", {
      name: /Заполнить с ИИ\s*:\s*Что происходит сейчас/,
    })
    .click();
  await expect(page.getByLabel("Что происходит сейчас")).toHaveValue(
    analysis.suggestions.context,
  );
  await expect(page.getByLabel("Что нужно изменить")).toHaveValue("");
  await page.getByLabel("Что происходит сейчас").fill("Моя правка");
  await page
    .getByRole("button", { name: "Заполнить пустые поля с ИИ", exact: true })
    .click();
  await expect(page.getByLabel("Что нужно изменить")).toHaveValue(
    analysis.suggestions.need,
  );
  await expect(page.getByLabel("Что происходит сейчас")).toHaveValue(
    "Моя правка",
  );
  await expect(page.getByLabel("Контакт бизнеса")).toHaveValue("");
});

test("malformed AI response preserves input and allows retry", async ({
  page,
}) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ json: { mode: "openai", questions: [] } }),
  );
  await page.goto("/tasks/new");
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await expect(page.locator(".form-error")).toContainText("некорректный ответ");
  await expect(page.getByLabel("Описание задачи", { exact: true })).toHaveValue(
    description,
  );
  await page.unroute("**/api/analyze");
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await expect(
    page.getByText("Локальный режим · без внешнего ИИ", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".field textarea")).toHaveCount(5);
});

test("analysis can be cancelled without losing the source or locking the form", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/analyze", async (route) => {
    await gate;
    await route.fulfill({ json: analysis }).catch(() => {});
  });
  await page.goto("/tasks/new");
  await page.getByLabel("Описание задачи", { exact: true }).fill(description);
  await page.getByRole("button", { name: "Помочь с описанием" }).click();
  await expect(
    page.getByLabel("Описание задачи", { exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Отменить анализ/ }).click();
  await expect(
    page.getByLabel("Описание задачи", { exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Описание задачи", { exact: true })).toHaveValue(
    description,
  );
  release();
  await expect(page.locator(".form-error")).toContainText("отменён");
});
