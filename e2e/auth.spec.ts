import { expect, test } from "@playwright/test";
import {
  ADMIN_SESSION,
  E2E_ORIGIN,
  MEMBER_SESSION,
  ROOM_NAME,
  SESSION_COOKIE,
  SIGNOUT_SESSION,
  signIn,
} from "./helpers";

test.describe("authentication", () => {
  test("anonymous /rooms is redirected to /join", async ({ page }) => {
    await page.goto("/rooms");

    await expect(page).toHaveURL(/\/join$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
  });

  test("a Google sign-in failure surfaces an error on the page", async ({
    page,
  }) => {
    await page.goto("/join");
    await page.getByRole("button", { name: "Continue with Google" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/join$/);
  });

  test("a signed-in user is redirected from /join to /rooms", async ({
    page,
  }) => {
    await signIn(page, MEMBER_SESSION);
    await page.goto("/join");

    await expect(page).toHaveURL(/\/rooms$/);
    await expect(
      page.getByRole("heading", { name: ROOM_NAME, level: 2 }),
    ).toBeVisible();
  });

  test("a seeded session lands on the hub with the demo room", async ({
    page,
  }) => {
    await signIn(page, ADMIN_SESSION);
    await page.goto("/rooms");

    const card = page.getByRole("link", { name: new RegExp(ROOM_NAME) });
    await expect(card).toBeVisible();
    await expect(card.getByText("ADMIN", { exact: true })).toBeVisible();
    await expect(card.getByText(/4 panels/)).toBeVisible();
  });

  test("a stale session cookie is cleared instead of looping", async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: SESSION_COOKIE,
        value: "not-a-real-session",
        url: E2E_ORIGIN,
      },
    ]);

    await page.goto("/rooms");
    await expect(page).toHaveURL(/\/join$/);

    const cookies = await page.context().cookies();
    expect(
      cookies.find((cookie) => cookie.name === SESSION_COOKIE),
    ).toBeUndefined();
  });

  test("sign out clears the session and returns to /join", async ({ page }) => {
    await signIn(page, SIGNOUT_SESSION);
    await page.goto("/rooms");
    await expect(
      page.getByRole("heading", { name: ROOM_NAME, level: 2 }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/join$/);

    const cookies = await page.context().cookies();
    expect(
      cookies.find((cookie) => cookie.name === SESSION_COOKIE),
    ).toBeUndefined();
  });
});
