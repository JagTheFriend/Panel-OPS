import { readFileSync } from "node:fs";
import path from "node:path";

export type DomainEntry = {
  name: string;
  description?: string;
};

type DomainConfig = {
  ROOM_PIN?: string;
  DOMAINS?: DomainEntry[];
};

export function readDomainConfig(): DomainConfig {
  try {
    return JSON.parse(
      readFileSync(path.join(process.cwd(), "domain.json"), "utf8"),
    ) as DomainConfig;
  } catch {
    return {};
  }
}
