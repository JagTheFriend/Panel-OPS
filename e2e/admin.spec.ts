import { expect, test } from "@playwright/test";
import {
  ADMIN_PIN,
  ADMIN_ROLL,
  createRoomUser,
  joinRoom,
  uniqueToken,
} from "./helpers";

test.describe("control room", () => {
  test("admin creates, edits, cleans up members and deletes a panel", async ({
    page,
  }) => {
    const panelName = uniqueToken("E2E Panel ");
    const description = uniqueToken("Desc ");
    const editedDescription = uniqueToken("Edited ");

    await joinRoom(page, ADMIN_ROLL, ADMIN_PIN);
    await page.goto("/admin/panels");
    await expect(
      page.getByRole("heading", { name: "Control room", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "New panel" }).click();
    const createDialog = page.getByRole("dialog", { name: "New panel" });
    await expect(createDialog).toBeVisible();
    await createDialog
      .getByLabel("Domain name", { exact: true })
      .fill(panelName);
    await createDialog
      .getByLabel("Description", { exact: true })
      .fill(description);
    await createDialog.getByLabel("Stations", { exact: true }).fill("4");
    await createDialog.getByRole("button", { name: "Create panel" }).click();

    await expect(
      page.getByText("Panel created", { exact: true }),
    ).toBeVisible();
    const row = page.getByRole("row").filter({ hasText: panelName });
    await expect(row).toBeVisible();
    await expect(row.locator("td").nth(1)).toHaveText("4");

    await page.getByRole("button", { name: `Edit ${panelName}` }).click();
    const editDialog = page.getByRole("dialog", { name: panelName });
    await expect(editDialog).toBeVisible();
    await editDialog
      .getByLabel("Description", { exact: true })
      .fill(editedDescription);
    await editDialog.getByLabel("Stations", { exact: true }).fill("7");
    await editDialog.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByText("Panel updated", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("row").filter({ hasText: editedDescription }),
    ).toBeVisible();
    await expect(row.locator("td").nth(1)).toHaveText("7");

    await row.getByRole("button", { name: `members of ${panelName}` }).click();
    await expect(page.getByText("Creator", { exact: true })).toBeVisible();

    await page
      .getByRole("button", { name: `Remove ${ADMIN_ROLL} from ${panelName}` })
      .click();
    const removeDialog = page.getByRole("dialog", {
      name: `Remove ${ADMIN_ROLL}?`,
    });
    await expect(removeDialog).toBeVisible();
    await removeDialog.getByRole("button", { name: "Remove member" }).click();
    await expect(
      page.getByText("Member removed", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("No members yet")).toBeVisible();

    await page.getByRole("button", { name: `Delete ${panelName}` }).click();
    const deleteDialog = page.getByRole("dialog", { name: panelName });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Delete panel" }).click();

    await expect(
      page.getByText("Panel deleted", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: panelName }),
    ).toHaveCount(0);
  });

  test("members table toggles roles and hides self-row actions", async ({
    page,
  }) => {
    await joinRoom(page, ADMIN_ROLL, ADMIN_PIN);
    await page.goto("/admin/members");
    await expect(
      page.getByRole("heading", { name: "Members", level: 1, exact: true }),
    ).toBeVisible();

    const selfRow = page.getByRole("row").filter({ hasText: ADMIN_ROLL });
    await expect(selfRow).toBeVisible();
    await expect(selfRow.getByText("You", { exact: true })).toBeVisible();
    await expect(
      selfRow.getByRole("button", { name: "Make admin" }),
    ).toHaveCount(0);
    await expect(
      selfRow.getByRole("button", { name: "Make member" }),
    ).toHaveCount(0);
    await expect(
      selfRow.getByRole("button", { name: `Delete ${ADMIN_ROLL}` }),
    ).toHaveCount(0);

    await page.getByLabel("Search members").fill("COORD001");
    const memberRow = page.getByRole("row").filter({ hasText: "COORD001" });
    await expect(memberRow).toBeVisible();

    await memberRow.getByRole("button", { name: "Make admin" }).click();
    await expect(page.getByText("Role updated", { exact: true })).toBeVisible();
    await expect(memberRow.getByText("ADMIN", { exact: true })).toBeVisible();

    await memberRow.getByRole("button", { name: "Make member" }).click();
    await expect(memberRow.getByText("USER", { exact: true })).toBeVisible();
    await expect(
      memberRow.getByRole("button", { name: "Make admin" }),
    ).toBeVisible();
  });

  test("a USER is redirected from /admin/* to /board", async ({ page }) => {
    await createRoomUser(page);

    await page.goto("/admin/panels");
    await expect(page).toHaveURL(/\/board$/);

    await page.goto("/admin/members");
    await expect(page).toHaveURL(/\/board$/);
  });
});
