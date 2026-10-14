import { expect, test } from "@playwright/test";
import {
  ADMIN_SESSION,
  addCandidate,
  cardIn,
  columnCount,
  directoryCard,
  kanbanColumn,
  MEMBER_BOARDS,
  MEMBER_SESSION,
  openPanelBoard,
  openRoom,
  SEEDED_PANEL,
} from "./helpers";

test.describe("panel board", () => {
  test("admin sees every active panel and its tiles", async ({ page }) => {
    const roomId = await openRoom(page, ADMIN_SESSION);

    for (const panelName of [
      ...MEMBER_BOARDS,
      "DevOps & Cloud",
      "UI/UX Design",
    ]) {
      await expect(
        page.getByRole("link", { name: `Open ${panelName} board` }),
      ).toBeVisible();
    }
    await expect(
      page.getByText("Active panels", { exact: true }),
    ).toBeVisible();
    expect(roomId).not.toBe("");
  });

  test("participant flows through Waiting → In interview → Done", async ({
    page,
  }) => {
    const roomId = await openRoom(page, ADMIN_SESSION);
    await openPanelBoard(page, roomId, SEEDED_PANEL);

    const waiting = kanbanColumn(page, "Waiting");
    const interviewing = kanbanColumn(page, "In interview");
    const done = kanbanColumn(page, "Done");

    const baselineWaiting = await columnCount(page, "Waiting");
    const baselineInterview = await columnCount(page, "In interview");
    const baselineDone = await columnCount(page, "Done");

    const rollNo = `${Date.now()}1`;
    await addCandidate(page, rollNo, "Queue Tester");

    await expect(cardIn(waiting, rollNo)).toBeVisible();
    expect(await columnCount(page, "Waiting")).toBe(baselineWaiting + 1);

    await cardIn(waiting, rollNo)
      .getByRole("button", { name: "Start", exact: true })
      .click();
    await expect(cardIn(interviewing, rollNo)).toBeVisible();
    expect(await columnCount(page, "In interview")).toBe(baselineInterview + 1);

    await cardIn(interviewing, rollNo)
      .getByRole("button", { name: "Done", exact: true })
      .click();
    await expect(cardIn(done, rollNo)).toBeVisible();
    expect(await columnCount(page, "Done")).toBe(baselineDone + 1);

    await cardIn(done, rollNo)
      .getByRole("button", { name: `Remove ${rollNo}` })
      .click();
    await page
      .getByRole("dialog", { name: "Remove participant?" })
      .getByRole("button", { name: "Remove", exact: true })
      .click();
    await expect(cardIn(done, rollNo)).toHaveCount(0);
  });

  test("a duplicate roll number is rejected", async ({ page }) => {
    const roomId = await openRoom(page, ADMIN_SESSION);
    await openPanelBoard(page, roomId, SEEDED_PANEL);

    const rollNo = `${Date.now()}2`;
    await addCandidate(page, rollNo, "First Try");
    await page.getByLabel("Roll number", { exact: true }).fill(rollNo);
    await page.getByRole("button", { name: "Add to queue" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "already in this panel's queue" }),
    ).toBeVisible();
  });

  test("a member sees only the panels they joined", async ({ page }) => {
    const roomId = await openRoom(page, MEMBER_SESSION);

    for (const panelName of MEMBER_BOARDS) {
      await expect(
        page.getByRole("link", { name: `Open ${panelName} board` }),
      ).toBeVisible();
    }
    for (const other of ["DevOps & Cloud", "UI/UX Design"]) {
      await expect(
        page.getByRole("link", { name: `Open ${other} board` }),
      ).toHaveCount(0);
    }

    // Members have no control-room link in the header.
    await expect(
      page.getByRole("link", { name: "Control", exact: true }),
    ).toHaveCount(0);
    expect(roomId).not.toBe("");
  });

  test("a member's board page hides the admin add form", async ({ page }) => {
    const roomId = await openRoom(page, MEMBER_SESSION);
    await openPanelBoard(page, roomId, SEEDED_PANEL);

    await expect(
      page.getByRole("heading", { name: SEEDED_PANEL, level: 1, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add to queue" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Leave panel" }),
    ).toBeVisible();
  });

  test("a member joins an unjoined panel from its board page", async ({
    page,
  }) => {
    const roomId = await openRoom(page, MEMBER_SESSION);
    await page.goto(`/rooms/${roomId}/panels`);

    await directoryCard(page, "DevOps & Cloud")
      .getByRole("link", { name: "View board" })
      .click();
    await expect(
      page.getByRole("heading", { name: "You are not a member of this panel" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Join this panel" }).click();
    await expect(
      page.getByText("Joined DevOps & Cloud", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Leave panel" }),
    ).toBeVisible();
  });
});
