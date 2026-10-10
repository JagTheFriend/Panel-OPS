import { expect, test } from "@playwright/test";
import {
  ADMIN_PIN,
  ADMIN_ROLL,
  addCandidate,
  cardIn,
  columnCount,
  freeSeatCount,
  joinRoom,
  kanbanColumn,
  occupiedStation,
  openPanelBoard,
  SEEDED_PANEL,
  uniqueRoll,
} from "./helpers";

test.describe("panel board", () => {
  test.beforeEach(async ({ page }) => {
    await joinRoom(page, ADMIN_ROLL, ADMIN_PIN);
    await openPanelBoard(page, SEEDED_PANEL);
  });

  test("participant flows through Waiting → In interview → Done", async ({
    page,
  }) => {
    const waiting = kanbanColumn(page, "Waiting");
    const interviewing = kanbanColumn(page, "In interview");
    const done = kanbanColumn(page, "Done");

    const baselineWaiting = await columnCount(page, "Waiting");
    const baselineInterview = await columnCount(page, "In interview");
    const baselineDone = await columnCount(page, "Done");
    const baselineFree = await freeSeatCount(page);

    const rollNo = uniqueRoll();
    await addCandidate(page, rollNo, "Queue Tester");

    await expect(cardIn(waiting, rollNo)).toBeVisible();
    expect(await columnCount(page, "Waiting")).toBe(baselineWaiting + 1);

    await cardIn(waiting, rollNo)
      .getByRole("button", { name: "Start" })
      .click();
    await expect(cardIn(interviewing, rollNo)).toBeVisible();
    expect(await columnCount(page, "Waiting")).toBe(baselineWaiting);
    expect(await columnCount(page, "In interview")).toBe(baselineInterview + 1);
    await expect(occupiedStation(page, rollNo)).toHaveCount(1);
    expect(await freeSeatCount(page)).toBe(baselineFree - 1);

    await cardIn(interviewing, rollNo)
      .getByRole("button", { name: "Done" })
      .click();
    const doneCard = cardIn(done, rollNo);
    await expect(doneCard).toBeVisible();
    await expect(doneCard).toContainText("interview");
    expect(await columnCount(page, "In interview")).toBe(baselineInterview);
    expect(await columnCount(page, "Done")).toBe(baselineDone + 1);
    await expect(occupiedStation(page, rollNo)).toHaveCount(0);
    expect(await freeSeatCount(page)).toBe(baselineFree);

    await doneCard.getByRole("button", { name: "Reopen" }).click();
    await expect(cardIn(waiting, rollNo)).toBeVisible();
    expect(await columnCount(page, "Done")).toBe(baselineDone);
    expect(await columnCount(page, "Waiting")).toBe(baselineWaiting + 1);

    await cardIn(waiting, rollNo)
      .getByRole("button", { name: `Remove ${rollNo}` })
      .click();
    const dialog = page.getByRole("dialog", { name: "Remove participant?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(cardIn(waiting, rollNo)).toHaveCount(0);
    expect(await columnCount(page, "Waiting")).toBe(baselineWaiting);
    expect(await columnCount(page, "Done")).toBe(baselineDone);
  });

  test("a waiting card can be dragged into another column", async ({
    page,
  }) => {
    const rollNo = uniqueRoll();
    await addCandidate(page, rollNo, "Drag Tester");

    const waiting = kanbanColumn(page, "Waiting");
    const done = kanbanColumn(page, "Done");
    await expect(cardIn(waiting, rollNo)).toBeVisible();
    const baselineWaiting = await columnCount(page, "Waiting");
    const baselineDone = await columnCount(page, "Done");

    const source = cardIn(waiting, rollNo);
    await source.dragTo(done.body, {
      sourcePosition: { x: 24, y: 14 },
      targetPosition: { x: 60, y: 60 },
      steps: 8,
    });

    const dragged = cardIn(done, rollNo);
    await expect(dragged).toBeVisible();
    expect(await columnCount(page, "Waiting")).toBe(baselineWaiting - 1);
    expect(await columnCount(page, "Done")).toBe(baselineDone + 1);

    await dragged.getByRole("button", { name: `Remove ${rollNo}` }).click();
    const dialog = page.getByRole("dialog", { name: "Remove participant?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(cardIn(done, rollNo)).toHaveCount(0);
    expect(await columnCount(page, "Done")).toBe(baselineDone);
  });
});
