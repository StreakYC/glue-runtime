/**
 * @module
 *
 * Internal types shared between the Glue runtime and the CLI/backend.
 *
 * This module contains the core type definitions used for event registration,
 * trigger configuration, and account injection throughout the Glue system.
 * These types ensure consistency between the runtime library and the backend
 * services that process and execute the registered triggers. These types should
 * not be needed by users creating Glues, its only for internal (to Glue) use.
 * @internal
 */

import { z } from "zod";
import { CommonAccountInjectionOptions } from "./common.ts";

export interface TriggerEvent {
  /** The event source type (e.g., "github", "stripe", "webhook") */
  type: string;
  /**
   * The unique label identifying the specific trigger registration within the
   * glue deployment.
   */
  label: string;
  /** The event-specific data payload, structure varies by event type. */
  data?: unknown;
}

export const TriggerEvent: z.ZodType<TriggerEvent> = z.object({
  type: z.string(),
  label: z.string(),
  data: z.unknown(),
});

export interface TriggerRegistration {
  /** The event source type this trigger is registered for */
  type: string;
  /**
   * The unique label identifying the specific trigger registration within the
   * glue deployment.
   */
  label: string;
  /** Event source specific configuration (varies by type) */
  config?: unknown;
}

export const TriggerRegistration: z.ZodType<TriggerRegistration> = z.object({
  type: z.string(),
  label: z.string(),
  config: z.object({}).passthrough().optional(),
});

export interface AccountInjectionBackendConfig extends CommonAccountInjectionOptions {
  scopes?: string[];
  selector?: string;
}

export const AccountInjectionBackendConfig: z.ZodType<AccountInjectionBackendConfig> = CommonAccountInjectionOptions.extend({
  scopes: z.array(z.string()).optional(),
  selector: z.string().optional(),
});

export interface AccountInjectionRegistration {
  type: string;
  /**
   * The unique label identifying the specific account injection within the glue
   * deployment.
   */
  label: string;
  config: AccountInjectionBackendConfig;
}

export const AccountInjectionRegistration: z.ZodType<AccountInjectionRegistration> = z
  .object({
    type: z.string(),
    label: z.string(),
    config: AccountInjectionBackendConfig,
  });

/**
 * Container for all registrations in a Glue application. This is the type that
 * the runtime serves on the `/__glue__/getRegistrations` to the backend.
 */
export interface Registrations {
  /** All event trigger registrations in the application */
  triggers: TriggerRegistration[];
  /** All account injection registrations in the application */
  accountInjections: AccountInjectionRegistration[];
}

export const Registrations: z.ZodType<Registrations> = z.object({
  triggers: z.array(TriggerRegistration),
  accountInjections: z.array(AccountInjectionRegistration),
  // TODO secretInjections
});

export type { CommonAccountInjectionOptions, CommonTriggerOptions } from "./common.ts";

// integration backend config types
export { CronTriggerBackendConfig } from "./integrations/cron/runtime.ts";
export { GithubTriggerBackendConfig } from "./integrations/github/runtime.ts";
export { GmailTriggerBackendConfig } from "./integrations/gmail/runtime.ts";
export { IntercomTriggerBackendConfig } from "./integrations/intercom/runtime.ts";
export { StreakTriggerBackendConfig } from "./integrations/streak/runtime.ts";
export { StripeTriggerBackendConfig } from "./integrations/stripe/runtime.ts";
export { WebhookTriggerBackendConfig } from "./integrations/webhook/runtime.ts";
