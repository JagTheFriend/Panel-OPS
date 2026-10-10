import { expect, type Locator, type Page } from "@playwright/test";

export const ADMIN_ROLL = "9001";
export const ADMIN_PIN = "7331";
export const ROOM_PIN = "1234";

/** Seeded panel that always has candidates in every column. */
export const SEEDED_PANEL = "Web Development";
/** Seeded panel used for join/leave round trips (baseline membership: nobody). */
export const DIRECTORY_PANEL = "DevOps & Cloud";

let sequence = 0;

/**
 * Collision-free token for names and panel names created by tests.
 */
export function uniqueToken(prefix: string): string {
  sequence += 1;
  return `${prefix}${Date.now().toString(36)}${sequence.toString(36)}`;
}

/** Collision-free numeric roll (roll numbers are digits only). */
export function uniqueRoll(): string {
  sequence += 1;
  return `${Date.now()}${sequence}`;
}

/** Fills the join form and waits until the session lands on /board. */
export async function joinRoom(
  page: Page,
  rollNo: string,
  pin: string,
  name?: string,
): Promise<void> {
  await page.goto("/join");
  await page.getByLabel("Roll number", { exact: true }).fill(rollNo);
  await page
    .getByLabel("Name", { exact: true })
    .fill(name ?? uniqueToken("User "));
  await page.getByLabel("Room PIN", { exact: true }).fill(pin);
  const firstDomain = page.locator('input[type="checkbox"]').first();
  if (await firstDomain.count()) {
    await firstDomain.check();
  }
  await page.getByRole("button", { name: "Enter the room" }).click();
  await expect(page).toHaveURL(/\/board$/);
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await joinRoom(page, ADMIN_ROLL, ADMIN_PIN);
}

/** Creates a brand-new USER via the room PIN and returns its roll number. */
export async function createRoomUser(page: Page): Promise<string> {
  const rollNo = uniqueRoll();
  await joinRoom(page, rollNo, ROOM_PIN, uniqueToken("User "));
  return rollNo;
}

export async function openPanelBoard(
  page: Page,
  panelName: string,
): Promise<void> {
  await page.goto("/board");
  // The card's overlay link covers the labelled arrow link, so the click is
  // forced — both point at the same /board/[panelId] route.
  await page
    .getByRole("link", { name: `Open ${panelName} board` })
    .click({ force: true });
  await expect(
    page.getByRole("heading", { name: panelName, level: 1, exact: true }),
  ).toBeVisible();
}

export async function addCandidate(
  page: Page,
  rollNo: string,
  name?: string,
): Promise<void> {
  await page.getByLabel("Roll number", { exact: true }).fill(rollNo);
  if (name) {
    await page.getByLabel("Name", { exact: true }).fill(name);
  }
  await page.getByRole("button", { name: "Add to queue" }).click();
  await expect(
    page.getByText(`${rollNo} joined the queue`, { exact: true }),
  ).toBeVisible();
}

export type KanbanColumn = {
  heading: Locator;
  badge: Locator;
  body: Locator;
};

/**
 * Resolves one kanban column from its visible heading:
 * h3 -> column header (count badge) -> <section> -> droppable body.
 */
export function kanbanColumn(page: Page, title: string): KanbanColumn {
  const heading = page.getByRole("heading", {
    name: title,
    level: 3,
    exact: true,
  });
  const header = heading.locator("..").locator("..");
  const section = header.locator("..");
  return {
    heading,
    badge: header.locator(":scope > span"),
    body: section.locator(":scope > div").last(),
  };
}

export async function columnCount(page: Page, title: string): Promise<number> {
  const { badge } = kanbanColumn(page, title);
  return Number((await badge.innerText()).trim());
}

/** The candidate card holding `rollNo` inside a column. */
export function cardIn(column: KanbanColumn, rollNo: string): Locator {
  return column.body
    .getByText(rollNo, { exact: true })
    .locator("..")
    .locator("..")
    .locator("..");
}

export function seatGrid(page: Page): Locator {
  return page.getByRole("img", { name: /stations free/ });
}

/** Seat chip holding an in-interview candidate. */
export function occupiedStation(page: Page, rollNo: string): Locator {
  return seatGrid(page).locator('span[title*="interviewing"]', {
    hasText: rollNo,
  });
}

/**
 * Reads the "N/M free" badge next to the station grid.
 *
 * Scoped to the seat card because client-side navigation briefly (and, in
 * this app, persistently until reload) leaves the previous route's DOM in the
 * document with `display: none`; text selectors match those hidden nodes too,
 * while role selectors do not.
 */
export async function freeSeatCount(page: Page): Promise<number> {
  const text = await seatGrid(page)
    .locator("..")
    .getByText(/^\d+\/\d+ free$/)
    .innerText();
  return Number(text.split("/")[0]);
}

/** Directory card for a panel name on /panels (h3 -> wrappers -> card). */
export function directoryCard(page: Page, panelName: string): Locator {
  return page
    .getByRole("heading", { name: panelName, level: 3, exact: true })
    .locator("..")
    .locator("..")
    .locator("..");
}
