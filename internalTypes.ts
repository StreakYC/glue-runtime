/**
 * This file has types shared between the runtime and the CLI/backend
 *
 * @module
 */

import { z } from "zod";

export const TriggerEvent: z.ZodType<TriggerEvent> = z.object({
  type: z.string(),
  label: z.string(),
  data: z.unknown(),
});

export interface TriggerEvent {
  type: string;
  label: string;
  data?: unknown;
}

export interface RegisteredTrigger {
  type: string;
  label: string;
  config: unknown;
}

export type { GithubConfig } from "./integrations/eventSources/github/runtime.ts";
export type { GmailConfig } from "./integrations/eventSources/gmail/runtime.ts";
export type { WebhookConfig } from "./integrations/eventSources/webhook/runtime.ts";
export type { CronConfig } from "./integrations/eventSources/cron/runtime.ts";
