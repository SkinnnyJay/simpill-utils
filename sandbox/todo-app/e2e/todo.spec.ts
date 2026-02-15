import { test, expect } from "@playwright/test";

test.describe("Todo app", () => {
  test("shows empty state when no todos", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("todo-empty")).toBeVisible();
    await expect(page.getByPlaceholder("What needs to be done?")).toBeVisible();
  });

  test("adds a todo", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("Buy milk");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByTestId("todo-list")).toBeVisible();
    await expect(page.getByText("Buy milk")).toBeVisible();
  });

  test("toggles todo complete", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("Task to complete");
    await page.getByRole("button", { name: "Add" }).click();
    const row = page.locator("li").filter({ hasText: "Task to complete" });
    await row.getByRole("checkbox").check();
    await expect(row.getByText("Task to complete")).toHaveClass(/line-through/);
  });

  test("filters active and completed", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("Active one");
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByPlaceholder("What needs to be done?").fill("Completed one");
    await page.getByRole("button", { name: "Add" }).click();
    await page.locator("li").filter({ hasText: "Completed one" }).getByRole("checkbox").check();
    await page.getByRole("tab", { name: "Active" }).click();
    await expect(page.getByText("Active one")).toBeVisible();
    await expect(page.getByText("Completed one")).not.toBeVisible();
    await page.getByRole("tab", { name: "Completed" }).click();
    await expect(page.getByText("Completed one")).toBeVisible();
    await expect(page.getByText("Active one")).not.toBeVisible();
  });

  test("clears completed", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("To clear");
    await page.getByRole("button", { name: "Add" }).click();
    await page.locator("li").filter({ hasText: "To clear" }).getByRole("checkbox").check();
    await page.getByRole("button", { name: "Clear completed" }).click();
    await expect(page.getByTestId("todo-empty")).toBeVisible();
  });

  test("validates empty title", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Title required")).toBeVisible();
  });

  test("edits todo inline", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("Original text");
    await page.getByRole("button", { name: "Add" }).click();
    const list = page.getByTestId("todo-list");
    const row = list.locator("li").filter({ hasText: "Original text" });
    await row.getByText("Original text").click();
    const editInput = list.locator("li").getByRole("textbox");
    await editInput.waitFor({ state: "visible", timeout: 5000 });
    await editInput.fill("Updated text");
    await editInput.press("Enter");
    await expect(list.getByText("Updated text")).toBeVisible();
    await expect(page.getByText("Original text")).not.toBeVisible();
  });

  test("deletes todo", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("To delete");
    await page.getByRole("button", { name: "Add" }).click();
    const row = page.locator("li").filter({ hasText: "To delete" });
    await row.hover();
    await row.getByRole("button", { name: 'Delete "To delete"' }).click();
    await expect(page.getByText("To delete")).not.toBeVisible();
  });

  test("changes priority", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("Prioritize me");
    await page.getByRole("button", { name: "Add" }).click();
    const row = page.locator("li").filter({ hasText: "Prioritize me" });
    await expect(row).toHaveAttribute("data-priority", "medium");
    await row.getByRole("combobox", { name: "Priority for Prioritize me" }).click();
    await page.getByRole("option", { name: "High" }).click();
    await expect(row).toHaveAttribute("data-priority", "high");
  });

  test("changes color", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("Color me");
    await page.getByRole("button", { name: "Add" }).click();
    const row = page.locator("li").filter({ hasText: "Color me" });
    await expect(row).toHaveAttribute("data-color", "zinc");
    await row.getByRole("combobox", { name: "Color for Color me" }).click();
    await page.getByRole("option", { name: "Blue" }).click();
    await expect(row).toHaveAttribute("data-color", "blue");
  });

  test("shows drag handles and sortable list when filter is All", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("First");
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByPlaceholder("What needs to be done?").fill("Second");
    await page.getByRole("button", { name: "Add" }).click();
    const list = page.getByTestId("todo-list");
    const items = list.locator("li");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("First");
    await expect(items.nth(1)).toContainText("Second");
    // Drag handles visible when filter is All and multiple items
    await expect(
      items.nth(0).getByRole("button", { name: "Drag to reorder" })
    ).toBeVisible();
    await expect(
      items.nth(1).getByRole("button", { name: "Drag to reorder" })
    ).toBeVisible();
    // No drag handle when viewing a single filter (e.g. Active with one item)
    await page.getByRole("tab", { name: "Active" }).click();
    await expect(list.locator("li").getByText("First")).toBeVisible();
    await expect(
      list.locator("li").getByRole("button", { name: "Drag to reorder" })
    ).not.toBeVisible();
  });

  test("completion shows visual state", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("What needs to be done?").fill("Done task");
    await page.getByRole("button", { name: "Add" }).click();
    const row = page.locator("li").filter({ hasText: "Done task" });
    await expect(row).toHaveAttribute("data-completed", "false");
    await row.getByRole("checkbox").check();
    await expect(row).toHaveAttribute("data-completed", "true");
    await expect(row.getByText("Done task")).toHaveClass(/line-through/);
  });

  test("theme toggle switches between dark and light", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const themeButton = page.getByRole("button", {
      name: /Switch to (light|dark) mode/,
    });
    const initialDark = await html.evaluate((el) => el.classList.contains("dark"));
    await themeButton.click();
    await expect(html).toHaveClass(initialDark ? "light" : "dark");
    await themeButton.click();
    await expect(html).toHaveClass(initialDark ? "dark" : "light");
  });

  test("clean interface has theme toggle and filters", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Switch to (light|dark) mode/ })
    ).toBeVisible();
    await expect(page.getByPlaceholder("What needs to be done?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "All" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Active" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Completed" })).toBeVisible();
  });
});
