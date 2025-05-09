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

export interface RegisteredTrigger {
  type: string;
  label: string;
  config?: unknown;
}

export const RegisteredTrigger: z.ZodType<RegisteredTrigger> = z.object({
  type: z.string(),
  label: z.string(),
  config: z.object({}).optional(),
});

export interface CredentialRequest {
  type: string;
  label: string;
  config?: unknown;
}

export const CredentialRequest: z.ZodType<CredentialRequest> = z.object({
  type: z.string(),
  label: z.string(),
  config: z.object({}).optional(),
});

export interface Registrations {
  triggers: RegisteredTrigger[];
  credentialRequests: CredentialRequest[];
}

export const Registrations: z.ZodType<Registrations> = z.object({
  triggers: z.array(RegisteredTrigger),
  credentialRequests: z.array(CredentialRequest),
});

export type { GithubConfig } from "./integrations/eventSources/github/runtime.ts";
export type { GmailConfig } from "./integrations/eventSources/gmail/runtime.ts";
export type { WebhookConfig } from "./integrations/eventSources/webhook/runtime.ts";
export type { CronConfig } from "./integrations/eventSources/cron/runtime.ts";
