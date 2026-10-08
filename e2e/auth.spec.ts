import { expect, test } from "@playwright/test";
import {
  ADMIN_PIN,
  ADMIN_ROLL,
  createRoomUser,
  joinRoom,
  uniqueRoll,
} from "./helpers";

test.describe("authentication", () => {
  test("anonymous /board is redirected to /join", async ({ page }) => {
    await page.goto("/board");

    await expect(page).toHaveURL(/\/join$/);
    await expect(page.getByLabel("Roll number", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Room PIN", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enter the room" }),
    ).toBeVisible();
  });

  test("an incorrect PIN shows an error", async ({ page }) => {
    await page.goto("/join");
    await page.getByLabel("Roll number", { exact: true }).fill(uniqueRoll());
    await page.getByLabel("Room PIN", { exact: true }).fill("0000");
    await page.getByRole("button", { name: "Enter the room" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Incorrect PIN" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/join$/);
    await expect(page.getByLabel("Roll number", { exact: true })).toBeVisible();
  });

  test("admin login lands on /board and logout returns to /join", async ({
    page,
  }) => {
    await joinRoom(page, ADMIN_ROLL, ADMIN_PIN);

    await expect(page).toHaveURL(/\/board$/);
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    await expect(header.getByText(ADMIN_ROLL, { exact: true })).toBeVisible();
    await expect(header.getByText("ADMIN", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Live board", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Members" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Control" })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/join$/);

    await page.goto("/board");
    await expect(page).toHaveURL(/\/join$/);
  });

  test("room PIN grants a non-admin USER session", async ({ page }) => {
    const rollNo = await createRoomUser(page);

    await expect(page).toHaveURL(/\/board$/);
    const header = page.getByRole("banner");
    await expect(header.getByText(rollNo, { exact: true })).toBeVisible();
    await expect(header.getByText("USER", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Members" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Control" })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Live board", exact: true }),
    ).toBeVisible();
  });
});
