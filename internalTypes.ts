/**
 * This file has types shared between the runtime and the CLI/backend
 *
 * @module
 */

import { z } from "zod";

export interface TriggerEvent {
  type: string;
  label: string;
  data?: unknown;
}

export const TriggerEvent: z.ZodType<TriggerEvent> = z.object({
  type: z.string(),
  label: z.string(),
  data: z.unknown(),
});

export interface TriggerRegistration {
  type: string;
  label: string;
  config?: unknown;
}

export const TriggerRegistration: z.ZodType<TriggerRegistration> = z.object({
  type: z.string(),
  label: z.string(),
  config: z.object({}).passthrough().optional(),
});

export interface AccountInjectionRegistration {
  type: string;
  label: string;
  config?: unknown;
}

export const AccountInjectionRegistration: z.ZodType<AccountInjectionRegistration> = z
  .object({
    type: z.string(),
    label: z.string(),
    config: z.object({}).passthrough().optional(),
  });

export interface Registrations {
  triggers: TriggerRegistration[];
  accountInjections: AccountInjectionRegistration[];
}

export const Registrations: z.ZodType<Registrations> = z.object({
  triggers: z.array(TriggerRegistration),
  accountInjections: z.array(AccountInjectionRegistration),
  // TODO secretInjections
});

export type { GithubConfig } from "./integrations/eventSources/github/runtime.ts";
export type { GmailConfig } from "./integrations/eventSources/gmail/runtime.ts";
export type { WebhookConfig } from "./integrations/eventSources/webhook/runtime.ts";
export type { CronConfig } from "./integrations/eventSources/cron/runtime.ts";
export type { StreakConfig } from "./integrations/eventSources/streak/runtime.ts";
export type { StripeConfig } from "./integrations/eventSources/stripe/runtime.ts";
export type { IntercomConfig } from "./integrations/eventSources/intercom/runtime.ts";
