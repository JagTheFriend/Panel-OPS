import { expect, test } from "@playwright/test";
import { createRoomUser, DIRECTORY_PANEL, directoryCard } from "./helpers";

test.describe("panels directory", () => {
  test("search filters the directory and join/leave round trip works", async ({
    page,
  }) => {
    await createRoomUser(page);

    await page.getByRole("link", { name: "Panels" }).click();
    await expect(page).toHaveURL(/\/panels$/);
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
    await expect(
      page.getByRole("heading", {
        name: "Data Science",
        level: 3,
        exact: true,
      }),
    ).toHaveCount(0);

    await search.fill("no-such-panel-xyz");
    await expect(
      page.getByRole("heading", {
        name: "No panels match your search",
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(directoryCard(page, DIRECTORY_PANEL)).toBeVisible();

    const card = directoryCard(page, DIRECTORY_PANEL);

    await card.getByRole("button", { name: "Join" }).click();
    await expect(page.getByText("Panel joined", { exact: true })).toBeVisible();
    await expect(card.getByText("Joined", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Open board" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Leave" })).toBeVisible();

    await card.getByRole("button", { name: "Leave" }).click();
    await expect(page.getByText("Panel left", { exact: true })).toBeVisible();
    await expect(card.getByRole("button", { name: "Join" })).toBeVisible();
    await expect(card.getByText("Joined", { exact: true })).toHaveCount(0);

    await card.getByRole("button", { name: "Join" }).click();
    await expect(card.getByRole("link", { name: "Open board" })).toBeVisible();
    await expect(card.getByText("Joined", { exact: true })).toBeVisible();

    await card.getByRole("button", { name: "Leave" }).click();
    await expect(card.getByRole("button", { name: "Join" })).toBeVisible();
  });
});
