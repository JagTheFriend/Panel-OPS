import { expect, test } from "@playwright/test";
import {
  ADMIN_PIN,
  ADMIN_ROLL,
  createRoomUser,
  DIRECTORY_PANEL,
  directoryCard,
  joinRoom,
} from "./helpers";

test.describe("panels directory", () => {
  test("member only sees the domains they picked", async ({ page }) => {
    await createRoomUser(page);

    await page.getByRole("link", { name: "Panels" }).click();
    await expect(page).toHaveURL(/\/panels$/);
    await expect(
      page.getByRole("heading", { name: "Panels", level: 1, exact: true }),
    ).toBeVisible();

    // createRoomUser picks the first checkbox (alphabetically first domain).
    await expect(
      page.getByRole("heading", {
        name: "Data Science",
        level: 3,
        exact: true,
      }),
    ).toBeVisible();
    for (const other of ["DevOps & Cloud", "UI/UX Design", "Web Development"]) {
      await expect(
        page.getByRole("heading", { name: other, level: 3, exact: true }),
      ).toHaveCount(0);
    }

    const search = page.getByLabel("Search panels");
    await search.fill("DevOps");
    await expect(
      page.getByRole("heading", {
        name: "No panels match your search",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();

    const card = directoryCard(page, "Data Science");
    await expect(card.getByRole("link", { name: "Open board" })).toBeVisible();
    await card.getByRole("button", { name: "Leave" }).click();
    await expect(page.getByText("Panel left", { exact: true })).toBeVisible();
    await expect(
      page.getByText("No panels yet", { exact: true }),
    ).toBeVisible();
  });

  test("admin sees every domain and can join/leave", async ({ page }) => {
    await joinRoom(page, ADMIN_ROLL, ADMIN_PIN);

    await page.getByRole("link", { name: "Panels" }).click();
    await expect(page).toHaveURL(/\/panels$/);

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

    // The seed joins the admin to every domain, so leave first, then rejoin.
    const card = directoryCard(page, DIRECTORY_PANEL);
    await expect(card.getByText("Joined", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Leave" }).click();
    await expect(page.getByText("Panel left", { exact: true })).toBeVisible();
    await expect(card.getByRole("button", { name: "Join" })).toBeVisible();
    await card.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Panel joined", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Open board" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Leave" })).toBeVisible();
  });
});
