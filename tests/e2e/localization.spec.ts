import { expect, test } from "@playwright/test";

test("languages persist and preserve task text during catalog updates", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/catalog");
  const language = page.locator(".language-control select");
  const coffee = page.locator('[data-task-id="task-coffee"]');
  const title = "Помогите кофейне сократить списания выпечки";
  await expect(coffee.getByRole("heading")).toHaveText(title);
  await coffee.locator(".preview-button").click();
  const previewTitle = page.locator("#catalog-preview h2");
  await expect(previewTitle).toHaveText(title);

  await language.selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".nav-list")).toContainText("Task catalog");
  await expect(coffee.getByRole("heading")).toHaveText(title);
  await expect(previewTitle).toHaveText(title);
  await page.locator("#search input").fill("zzzz-no-results");
  await expect(coffee).toHaveCount(0);
  await page.locator("#search input").fill("");
  await expect(coffee.getByRole("heading")).toHaveText(title);

  await language.selectOption("kk");
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
  await expect(page.locator(".nav-list")).toContainText("Тапсырмалар каталогы");
  await coffee.locator(".preview-button").click();
  await expect(previewTitle).toHaveText(title);
  await coffee.getByRole("heading").getByRole("link").click();
  await expect(page.locator("main h1")).toHaveText(title);
  await page.reload();
  await expect(language).toHaveValue("kk");
  await expect(page.locator("main h1")).toHaveText(title);

  await language.selectOption("ru");
  await expect(page.locator(".nav-list")).toContainText("Каталог задач");
  await expect(page.locator("main h1")).toHaveText(title);
  expect(errors).toEqual([]);
});

test("language changes preserve editor values and canonical topic submission", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/tasks/new");
  const language = page.locator(".language-control select");
  const description =
    "Служба доставки вручную распределяет заказы между курьерами. Есть обезличенная таблица адресов. Нужно сократить время планирования с 40 до 10 минут.";
  const input = page.locator("textarea").first();
  await input.fill(description);
  await language.selectOption("en");
  await expect(input).toHaveValue(description);
  const topic = page.getByRole("combobox", { name: "Topic", exact: true });
  await topic.selectOption("Торговля");
  await expect(topic).toHaveValue("Торговля");
  await language.selectOption("kk");
  await expect(input).toHaveValue(description);
  await language.selectOption("ru");
  await expect(input).toHaveValue(description);
  await expect(
    page.getByRole("combobox", { name: "Тема", exact: true }),
  ).toHaveValue("Торговля");

  const submitted = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/demo") && request.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Сохранить черновик", exact: true })
    .click();
  const action = (await submitted).postDataJSON();
  expect(action.card.topic).toBe("Торговля");
  expect(action.rawDescription).toBe(description);
  expect(errors).toEqual([]);
});

test("language switching remains usable when browser storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/catalog");
  await page.locator(".language-control select").selectOption("en");
  await expect(page.locator(".nav-list")).toContainText("Task catalog");
  await expect(page.locator('[data-task-id="task-coffee"]')).toBeVisible();
  expect(errors).toEqual([]);
});
