/**
 * Internal types shared between the Glue runtime and the backend API. These
 * types are not intended for most Glue users to use.
 *
 * @ignore
 * @module
 */

import { z } from "zod";
import { CommonCredentialFetcherOptions } from "./common.ts";

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

export interface CredentialFetcherBackendConfig extends CommonCredentialFetcherOptions {
  scopes?: string[];
  selector?: string;
}

export const CredentialFetcherBackendConfig: z.ZodType<CredentialFetcherBackendConfig> =
  CommonCredentialFetcherOptions.extend({
    scopes: z.array(z.string()).optional(),
    selector: z.string().optional(),
  });

export interface CredentialFetcherRegistration {
  type: string;
  /**
   * The unique label identifying the specific credential fetcher within the
   * glue deployment.
   */
  label: string;
  config: CredentialFetcherBackendConfig;
}

export const CredentialFetcherRegistration: z.ZodType<CredentialFetcherRegistration> = z
  .object({
    type: z.string(),
    label: z.string(),
    config: CredentialFetcherBackendConfig,
  });

/**
 * Container for all registrations in a Glue application. This is the type that
 * the runtime serves on the `/__glue__/getRegistrations` to the backend.
 */
export interface Registrations {
  /** All event trigger registrations in the application */
  triggers: TriggerRegistration[];
  /** All credential fetcher registrations in the application */
  accountInjections: CredentialFetcherRegistration[];
}

export const Registrations: z.ZodType<Registrations> = z.object({
  triggers: z.array(TriggerRegistration),
  accountInjections: z.array(CredentialFetcherRegistration),
  // TODO secretInjections
});

export type { CommonCredentialFetcherOptions, CommonTriggerOptions } from "./common.ts";

/** Represents a credential using an access token */
export interface AccessTokenCredential {
  accessToken: string;
  expiresAt?: number;
}

/** Represents a credential using an API key */
export interface ApiKeyCredential {
  apiKey: string;
}

// integration backend config types
export { CronTriggerBackendConfig } from "./integrations/cron/runtime.ts";
export { GithubTriggerBackendConfig } from "./integrations/github/runtime.ts";
export { GmailTriggerBackendConfig } from "./integrations/gmail/runtime.ts";
export { IntercomTriggerBackendConfig } from "./integrations/intercom/runtime.ts";
export { SlackEventWebhook, SlackTriggerBackendConfig } from "./integrations/slack/runtime.ts";
export { StreakTriggerBackendConfig } from "./integrations/streak/runtime.ts";
export { StripeTriggerBackendConfig } from "./integrations/stripe/runtime.ts";
export { WebhookTriggerBackendConfig } from "./integrations/webhook/runtime.ts";
