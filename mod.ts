import { Google } from "./integrations/google/runtime.ts";
export type { Google };
import { Gmail } from "./integrations/gmail/runtime.ts";
export type { Gmail };
import { Webhook } from "./integrations/webhook/runtime.ts";
export type { Webhook };
import { Github } from "./integrations/github/runtime.ts";
export type { Github };
import { Streak } from "./integrations/streak/runtime.ts";
export type { Streak };
import { Stripe } from "./integrations/stripe/runtime.ts";
export type { Stripe };
import { Cron } from "./integrations/cron/runtime.ts";
export type { Cron };
import { Intercom } from "./integrations/intercom/runtime.ts";
export type { Intercom };
import { Slack } from "./integrations/slack/runtime.ts";
export type { Slack };
import { Resend } from "./integrations/resend/runtime.ts";
export type { Resend };
import { Debug } from "./integrations/debug/runtime.ts";
export type { Debug };
import { Drive } from "./integrations/drive/runtime.ts";
export type { Drive };
import { Sheets } from "./integrations/sheets/runtime.ts";
export type { Sheets };
export type { GoogleCredentialFetcherOptions } from "./integrations/google/runtime.ts";
export type { GmailMessageEvent, GmailTriggerOptions } from "./integrations/gmail/runtime.ts";
export type {
  DriveChangeEvent,
  DriveChangesTriggerOptions,
  DriveSingleFileChangeEvent,
  DriveSingleFileTriggerOptions,
} from "./integrations/drive/runtime.ts";
export type {
  SheetNewCommentEvent,
  SheetNewOrUpdatedRowEvent,
  SheetNewRowEvent,
  SheetNewWorksheetEvent,
  SheetsTriggerOptions,
} from "./integrations/sheets/runtime.ts";
export type { GithubEvent, GithubTriggerOptions } from "./integrations/github/runtime.ts";
export type { WebhookEvent, WebhookTriggerOptions } from "./integrations/webhook/runtime.ts";
export type { CronEvent } from "./integrations/cron/runtime.ts";
export type {
  BoxEventType,
  StreakCredentialFetcherOptions,
  StreakEvent,
  StreakTriggerOptions,
} from "./integrations/streak/runtime.ts";
export type { StripeEvent, StripeTriggerOptions } from "./integrations/stripe/runtime.ts";
export type { IntercomEvent, IntercomTriggerOptions } from "./integrations/intercom/runtime.ts";
export type {
  SlackCredentialFetcherOptions,
  SlackEventWebhook,
  SlackTriggerOptions,
} from "./integrations/slack/runtime.ts";
export type { ResendCredentialFetcherOptions } from "./integrations/resend/runtime.ts";
export type {
  AccessTokenCredential,
  ApiKeyCredential,
  CredentialFetcher,
} from "./runtimeSupport.ts";
export type { CommonCredentialFetcherOptions, CommonTriggerOptions } from "./common.ts";

/**
 * The main Glue runtime class that provides access to all event sources.
 *
 * This class acts as a facade to all available event source integrations,
 * providing a unified interface for registering event listeners across
 * different platforms and services.
 *
 * This class is made available to users through the {@link glue} singleton.
 */
class Glue {
  /**
   * Google Drive event source for listening to changes in Drive.
   */
  readonly drive: Drive = new Drive();

  /**
   * Google Sheets event source for listening to changes in Sheets.
   */
  readonly sheets: Sheets = new Sheets();

  /**
   * Gmail event source for listening to email events.
   * Allows you to react to new emails in connected Gmail accounts.
   */
  readonly gmail: Gmail = new Gmail();

  readonly google: Google = new Google();

  /**
   * Webhook event source for handling HTTP webhook requests.
   * Creates endpoints that can receive HTTP requests from external services.
   */
  readonly webhook: Webhook = new Webhook();

  /**
   * Cron event source for scheduling recurring tasks.
   * Supports standard cron expressions and convenience methods for common intervals.
   */
  readonly cron: Cron = new Cron();

  /**
   * GitHub event source for repository and organization events.
   * Listens to GitHub webhooks for events like pull requests, issues, and pushes.
   */
  readonly github: Github = new Github();

  /**
   * Streak CRM event source for pipeline and box events.
   * Monitors changes in Streak CRM pipelines, boxes, tasks, and emails.
   */
  readonly streak: Streak = new Streak();

  /**
   * Stripe event source for payment and subscription events.
   * Handles Stripe webhooks for customer, payment, and subscription lifecycle events.
   */
  readonly stripe: Stripe = new Stripe();

  /**
   * Intercom event source for customer conversation events.
   * Tracks events in Intercom workspaces like conversation closures.
   */
  readonly intercom: Intercom = new Intercom();

  /**
   * Slack event source for all Slack events.
   * Tracks events in Slack workspaces like messages, channels, users, etc.
   */
  readonly slack: Slack = new Slack();

  /**
   * Resend event source for sending emails.
   * Sends emails using the Resend API.
   */
  readonly resend: Resend = new Resend();

  /**
   * Debug utilities exposing low-level registration helpers.
   * These APIs are unstable and intended for internal / experimental use.
   */
  readonly debug: Debug = new Debug();
}

export type { Glue };

/**
 * The global Glue runtime instance.
 *
 * This is the primary way to interact with the Glue runtime. Import this
 * instance to register event listeners in your application.
 *
 * @example
 * ```typescript
 * import { glue } from "jsr:@streak-glue/runtime";
 *
 * glue.stripe.onCustomerCreated((event) => {
 *   console.log("New customer:", event.data.object.email);
 * });
 * ```
 */
export const glue: Glue = new Glue();
