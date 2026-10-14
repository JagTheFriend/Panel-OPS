import "dotenv/config";
import { expect, type Locator, type Page } from "@playwright/test";
import { signedSessionCookie } from "../prisma/session-cookie";

export const E2E_ORIGIN = "http://localhost:3110";
export const SESSION_COOKIE = "better-auth.session_token";

/** Session tokens seeded by prisma/seed.ts (dev + e2e log in via the DB). */
export const ADMIN_SESSION = "dev-session-admin";
export const MEMBER_SESSION = "dev-session-member";
export const OUTSIDER_SESSION = "dev-session-outsider";
/** Disposable admin session — sign-out deletes it, so shared tokens stay valid. */
export const SIGNOUT_SESSION = "dev-session-signout";

/** Demo room seeded by prisma/seed.ts. */
export const ROOM_NAME = "Demo Room";
export const ROOM_CODE = "DEMO42";
export const ADMIN_PIN = "7331";
export const NORMAL_PIN = "1234";

export const ADMIN_EMAIL = "admin@panelops.dev";
export const MEMBER_EMAIL = "member@panelops.dev";

/** Seeded panel that always has candidates in every column. */
export const SEEDED_PANEL = "Web Development";
/** Seeded panel used for join/leave round trips (seed joins the admin). */
export const DIRECTORY_PANEL = "DevOps & Cloud";
/** Panels the seeded member has joined (their board shows only these). */
export const MEMBER_BOARDS = ["Web Development", "Data Science"];

let sequence = 0;

/**
 * Collision-free token for names and panel names created by tests.
 */
export function uniqueToken(prefix: string): string {
  sequence += 1;
  return `${prefix}${Date.now().toString(36)}${sequence.toString(36)}`;
}

/** Plants the seeded better-auth session cookie for this browser context. */
export async function signIn(page: Page, sessionToken: string): Promise<void> {
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: signedSessionCookie(sessionToken),
      url: E2E_ORIGIN,
    },
  ]);
}

/** Signs in and opens the room's board; returns the room id. */
export async function openRoom(
  page: Page,
  sessionToken: string,
  roomName: string = ROOM_NAME,
): Promise<string> {
  await signIn(page, sessionToken);
  await page.goto("/rooms");
  await page.getByRole("heading", { name: roomName, level: 2 }).click();
  await expect(page).toHaveURL(/\/rooms\/[^/]+\/board$/);
  return new URL(page.url()).pathname.split("/")[2];
}

export async function openPanelBoard(
  page: Page,
  roomId: string,
  panelName: string,
): Promise<void> {
  await page.goto(`/rooms/${roomId}/board`);
  // The card's overlay link covers the labelled arrow link, so the click is
  // forced — both point at the same board route.
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

/** Directory card for a panel name on /panels (h3 -> wrappers -> card). */
export function directoryCard(page: Page, panelName: string): Locator {
  return page
    .getByRole("heading", { name: panelName, level: 3, exact: true })
    .locator("..")
    .locator("..")
    .locator("..");
}
