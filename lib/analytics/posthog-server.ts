import { after } from "next/server";
import { PostHog } from "posthog-node";

type EventProperties = Record<string, string | number | boolean | null>;

let client: PostHog | null = null;

function getKey(): string | null {
  if (process.env.POSTHOG_DISABLED === "true") return null;
  return (
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    null
  );
}

function getClient(): PostHog | null {
  const key = getKey();
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

async function captureServerEvent(input: {
  distinctId: string;
  event: string;
  properties?: EventProperties;
}): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  try {
    await ph.captureImmediate({
      distinctId: input.distinctId,
      event: input.event,
      properties: input.properties ?? {},
    });
  } catch (error) {
    console.warn(
      "[posthog] capture failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Records a domain event server-side (authoritative source — works even when the
 * client misses it). Delivery is deferred until after the response via `after()`
 * so it never adds latency to the action itself.
 *
 * Event naming follows PostHog's `[object] [verb]` convention.
 */
export function trackDomainEvent(
  actor: { id: string; role?: string | null },
  event: string,
  properties: EventProperties = {},
): void {
  const promise = captureServerEvent({
    distinctId: `user:${actor.id}`,
    event,
    properties: {
      actor_user: actor.id,
      actor_role: actor.role ?? null,
      ...properties,
    },
  });

  try {
    after(() => promise);
  } catch {
    // Outside a request scope (unit tests / scripts): keep the floating promise.
    void promise;
  }
}
