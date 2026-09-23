import { expect, test } from "@playwright/test";

test("public surfaces and workspaces have no broken assets, runtime errors or horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  const failedAssets: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failedAssets.push(`${response.status()} ${response.url()}`);
  });
  for (const route of [
    "/",
    "/catalog",
    "/tasks/new",
    "/tasks/task-coffee",
    "/tasks/draft-coffee/edit",
    "/business",
    "/team",
    "/teams",
    "/guide",
  ]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.getByLabel("Загрузка", { exact: true })).toHaveCount(0);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${route} at ${width}px`,
      ).toBeLessThanOrEqual(width);
    }
    const sources = await page
      .locator("img")
      .evaluateAll((images) => [
        ...new Set(
          images.map((image) => image.getAttribute("src")).filter(Boolean),
        ),
      ]);
    for (const source of sources) {
      expect(
        (await page.request.get(source!)).ok(),
        `${route}: ${source}`,
      ).toBe(true);
    }
    expect(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images
            .filter(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth === 0,
            )
            .map((image) => image.getAttribute("src")),
        ),
      route,
    ).toEqual([]);
  }
  expect(failedAssets).toEqual([]);
  expect(errors).toEqual([]);
});
