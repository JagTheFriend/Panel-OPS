import { expect, test } from "@playwright/test";
import {
  ADMIN_SESSION,
  DIRECTORY_PANEL,
  directoryCard,
  MEMBER_SESSION,
  openRoom,
} from "./helpers";

test.describe("panels directory", () => {
  test("every room member sees all active panels with join state", async ({
    page,
  }) => {
    const roomId = await openRoom(page, MEMBER_SESSION);
    await page.getByRole("link", { name: "Panels", exact: true }).click();
    await expect(page).toHaveURL(/\/rooms\/[^/]+\/panels$/);
    await expect(
      page.getByRole("heading", { name: "Panels", level: 1, exact: true }),
    ).toBeVisible();

    for (const panelName of [
      "Data Science",
      DIRECTORY_PANEL,
      "UI/UX Design",
      "Web Development",
    ]) {
      await expect(
        page.getByRole("heading", { name: panelName, level: 3, exact: true }),
      ).toBeVisible();
    }

    const search = page.getByLabel("Search panels");
    await search.fill("DevOps");
    await expect(directoryCard(page, DIRECTORY_PANEL)).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Web Development",
        level: 3,
        exact: true,
      }),
    ).toHaveCount(0);
    await search.fill("");

    expect(roomId).not.toBe("");
  });

  test("a member leaves a joined panel and joins a new one", async ({
    page,
  }) => {
    const roomId = await openRoom(page, MEMBER_SESSION);
    await page.goto(`/rooms/${roomId}/panels`);

    const joined = directoryCard(page, "Web Development");
    await expect(joined.getByText("Joined", { exact: true })).toBeVisible();
    await joined.getByRole("button", { name: "Leave" }).click();
    await expect(page.getByText("Panel left", { exact: true })).toBeVisible();
    await expect(
      directoryCard(page, "Web Development").getByRole("button", {
        name: "Join",
      }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Join", exact: true })
      .first()
      .click();
    await expect(page.getByText("Panel joined", { exact: true })).toBeVisible();
  });

  test("an admin sees every panel and can leave/rejoin", async ({ page }) => {
    const roomId = await openRoom(page, ADMIN_SESSION);
    await page.goto(`/rooms/${roomId}/panels`);

    for (const panelName of [
      "Data Science",
      DIRECTORY_PANEL,
      "UI/UX Design",
      "Web Development",
    ]) {
      await expect(
        page.getByRole("heading", { name: panelName, level: 3, exact: true }),
      ).toBeVisible();
    }

    // The seed joins the admin to every panel, so leave first, then rejoin.
    const card = directoryCard(page, DIRECTORY_PANEL);
    await expect(card.getByText("Joined", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Leave" }).click();
    await expect(page.getByText("Panel left", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Panel joined", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Open board" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Leave" })).toBeVisible();
  });
});
