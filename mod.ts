import * as gmailEventSource from "./integrations/eventSources/gmail/runtime.ts";
import * as webhookEventSource from "./integrations/eventSources/webhook/runtime.ts";
import * as githubEventSource from "./integrations/eventSources/github/runtime.ts";
import * as streakEventSource from "./integrations/eventSources/streak/runtime.ts";
export type {
  GmailMessageEvent,
  GmailTriggerOptions,
} from "./integrations/eventSources/gmail/runtime.ts";
export type {
  GithubEvent,
  GithubTriggerOptions,
} from "./integrations/eventSources/github/runtime.ts";
export type {
  WebhookEvent,
  WebhookTriggerOptions,
} from "./integrations/eventSources/webhook/runtime.ts";
export type { CronEvent } from "./integrations/eventSources/cron/runtime.ts";
export type {
  StreakEvent,
} from "./integrations/eventSources/streak/runtime.ts";
export type { CommonTriggerOptions } from "./runtimeSupport.ts";

class Glue {
  readonly gmail: gmailEventSource.Gmail = new gmailEventSource.Gmail();
  readonly webhook: webhookEventSource.Webhook = new webhookEventSource
    .Webhook();
  readonly github: githubEventSource.Github = new githubEventSource.Github();
  readonly streak: streakEventSource.Streak = new streakEventSource.Streak();
}

export type { Glue };

export const glue: Glue = new Glue();
