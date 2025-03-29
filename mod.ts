import * as gmailEventSource from "./integrations/eventSources/gmail/runtime.ts";
import * as webhookEventSource from "./integrations/eventSources/webhook/runtime.ts";
import * as githubEventSource from "./integrations/eventSources/github/runtime.ts";
export type { CommonTriggerOptions } from "./runtimeSupport.ts";
export type { GmailMessageEvent } from "./integrations/eventSources/gmail/runtime.ts";
export type { WebhookEvent } from "./integrations/eventSources/webhook/runtime.ts";

class Glue {
  readonly gmail: gmailEventSource.Gmail = new gmailEventSource.Gmail();
  readonly webhook: webhookEventSource.Webhook = new webhookEventSource
    .Webhook();
  readonly github: githubEventSource.Github = new githubEventSource.Github();
}

export type { Glue };

export const glue: Glue = new Glue();
