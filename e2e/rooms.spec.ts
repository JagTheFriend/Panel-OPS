import { expect, test } from "@playwright/test";
import {
  ADMIN_PIN,
  MEMBER_SESSION,
  NORMAL_PIN,
  OUTSIDER_SESSION,
  ROOM_CODE,
  signIn,
  uniqueToken,
} from "./helpers";

test.describe("rooms", () => {
  test("a user creates a room and becomes its admin", async ({ page }) => {
    const roomName = uniqueToken("Room ");
    await signIn(page, MEMBER_SESSION);
    await page.goto("/rooms");

    await page.getByLabel("Room name").fill(roomName);
    await page.getByLabel("Admin PIN", { exact: true }).fill("7777");
    await page.getByLabel("Normal PIN", { exact: true }).fill("8888");
    await page.getByRole("button", { name: "Create room" }).click();

    await expect(page).toHaveURL(/\/rooms\/[^/]+\/board$/);
    await expect(
      page.getByRole("heading", { name: "No active panels yet" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Copy room code [A-Z0-9]+/ }),
    ).toBeVisible();

    await page.goto(
      `/rooms/${new URL(page.url()).pathname.split("/")[2]}/admin/panels`,
    );
    await expect(
      page.getByRole("heading", { name: "Control room", exact: true }),
    ).toBeVisible();
  });

  test("create room rejects identical pins", async ({ page }) => {
    await signIn(page, MEMBER_SESSION);
    await page.goto("/rooms");

    await page.getByLabel("Room name").fill(uniqueToken("Room "));
    await page.getByLabel("Admin PIN", { exact: true }).fill("5555");
    await page.getByLabel("Normal PIN", { exact: true }).fill("5555");
    await page.getByRole("button", { name: "Create room" }).click();

    await expect(
      page.getByText("Admin and normal PIN must differ"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/rooms$/);
  });

  test("an outsider joins a room by code and PIN", async ({ page }) => {
    await signIn(page, OUTSIDER_SESSION);
    await page.goto("/rooms");

    await expect(
      page.getByRole("heading", { name: "You are not in any room yet" }),
    ).toBeVisible();

    await page.getByLabel("Room code", { exact: true }).fill(ROOM_CODE);
    await page.getByLabel("PIN", { exact: true }).fill("0000");
    await page.getByRole("button", { name: "Join room" }).click();
    await expect(page.getByText("Incorrect PIN for this room.")).toBeVisible();

    await page.getByLabel("PIN", { exact: true }).fill(NORMAL_PIN);
    await page.getByRole("button", { name: "Join room" }).click();

    await expect(page).toHaveURL(/\/rooms\/[^/]+\/board$/);
    await expect(page.getByText("USER", { exact: true }).first()).toBeVisible();

    // A USER without panel joins sees an empty board, then joins from the directory.
    await expect(
      page.getByRole("heading", { name: "No active panels yet" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Panels", exact: true }).click();
    await expect(page).toHaveURL(/\/rooms\/[^/]+\/panels$/);
    await page.getByRole("button", { name: "Join" }).first().click();
    await expect(page.getByText("Panel joined", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Board", exact: true }).click();
    await expect(page).toHaveURL(/\/rooms\/[^/]+\/board$/);
    await expect(
      page.getByRole("heading", {
        name: "Data Science",
        level: 3,
        exact: true,
      }),
    ).toBeVisible();
  });

  test("rejoining with the admin PIN upgrades the role", async ({ page }) => {
    await signIn(page, OUTSIDER_SESSION);
    await page.goto("/rooms");

    await page.getByLabel("Room code", { exact: true }).fill(ROOM_CODE);
    await page.getByLabel("PIN", { exact: true }).fill(NORMAL_PIN);
    await page.getByRole("button", { name: "Join room" }).click();
    await expect(page).toHaveURL(/\/rooms\/[^/]+\/board$/);
    await expect(page.getByText("USER", { exact: true }).first()).toBeVisible();

    await page.getByRole("link", { name: /PanelOps/ }).click();
    await expect(page).toHaveURL(/\/rooms$/);

    await page.getByLabel("Room code", { exact: true }).fill(ROOM_CODE);
    await page.getByLabel("PIN", { exact: true }).fill(ADMIN_PIN);
    await page.getByRole("button", { name: "Join room" }).click();

    await expect(page).toHaveURL(/\/rooms\/[^/]+\/board$/);
    await expect(
      page.getByText("ADMIN", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Control", exact: true }),
    ).toBeVisible();
  });

  test("an unknown room code shows a not-found error", async ({ page }) => {
    await signIn(page, MEMBER_SESSION);
    await page.goto("/rooms");

    await page.getByLabel("Room code", { exact: true }).fill("NOPE99");
    await page.getByLabel("PIN", { exact: true }).fill(NORMAL_PIN);
    await page.getByRole("button", { name: "Join room" }).click();

    await expect(page.getByText("No room with that code.")).toBeVisible();
  });
});
