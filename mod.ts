/**
 * @module
 *
 * Glue Runtime - A comprehensive event-driven runtime for building serverless integrations
 *
 * This package provides a unified interface for listening to events from various external services
 * and platforms. It allows developers to easily build reactive applications that respond to events
 * from GitHub, Gmail, webhooks, cron schedules, Stripe, Intercom, Webflow, and Streak.
 *
 * ## Overview
 *
 * The Glue runtime operates by registering event listeners that are triggered when specific events
 * occur in connected services. Each event source provides type-safe event handlers with full
 * TypeScript support.
 *
 * ## Basic Usage
 *
 * ```typescript
 * import { glue } from "@glue/runtime";
 *
 * // Listen for GitHub pull request events
 * glue.github.onPullRequestEvent("owner", "repo", (event) => {
 *   console.log("New PR:", event.payload.pull_request.title);
 * });
 *
 * // Schedule a cron job
 * glue.cron.everyXMinutes(5, () => {
 *   console.log("Running every 5 minutes");
 * });
 *
 * // Handle webhook requests
 * glue.webhook.onPost((event) => {
 *   console.log("Received POST:", event.bodyText);
 * });
 * ```
 *
 * ## Event Sources
 *
 * - **GitHub**: Repository and organization events (pull requests, issues, pushes, etc.)
 * - **Gmail**: Email message events
 * - **Webhook**: HTTP webhook endpoints (GET, POST, etc.)
 * - **Cron**: Scheduled tasks using cron expressions
 * - **Stripe**: Payment and subscription events
 * - **Intercom**: Customer conversation events
 * - **Webflow**: Website and CMS events
 * - **Streak**: CRM pipeline and box events
 *
 * All event handlers must be registered at the top level of your application during initialization.
 */

import { Google } from "./integrations/google/runtime.ts";
import * as gmailEventSource from "./integrations/gmail/runtime.ts";
import * as webhookEventSource from "./integrations/webhook/runtime.ts";
import * as githubEventSource from "./integrations/github/runtime.ts";
import * as streakEventSource from "./integrations/streak/runtime.ts";
import * as stripeEventSource from "./integrations/stripe/runtime.ts";
import * as cronEventSource from "./integrations/cron/runtime.ts";
import * as intercomEventSource from "./integrations/intercom/runtime.ts";
export type { GoogleAccountInjectionOptions } from "./integrations/google/runtime.ts";
export type { GmailMessageEvent, GmailTriggerOptions } from "./integrations/gmail/runtime.ts";
export type { GithubEvent, GithubTriggerOptions } from "./integrations/github/runtime.ts";
export type { WebhookEvent, WebhookTriggerOptions } from "./integrations/webhook/runtime.ts";
export type { CronEvent } from "./integrations/cron/runtime.ts";
export type { BoxEventType, StreakAccountInjectionOptions, StreakEvent, StreakTriggerOptions } from "./integrations/streak/runtime.ts";
export type { StripeEvent, StripeTriggerOptions } from "./integrations/stripe/runtime.ts";
export type { IntercomEvent, IntercomTriggerOptions } from "./integrations/intercom/runtime.ts";
export type { AccessTokenCredential, ApiKeyCredential, CommonTriggerOptions } from "./runtimeSupport.ts";

/**
 * The main Glue runtime class that provides access to all event sources.
 *
 * This class acts as a facade to all available event source integrations,
 * providing a unified interface for registering event listeners across
 * different platforms and services.
 *
 * @example
 * ```typescript
 * const myGlue = new Glue();
 * myGlue.github.onPullRequestEvent("owner", "repo", handlePR);
 * ```
 */
class Glue {
  /**
   * Gmail event source for listening to email events.
   * Allows you to react to new emails in connected Gmail accounts.
   */
  readonly gmail: gmailEventSource.Gmail = new gmailEventSource.Gmail();

  readonly google: Google = new Google();

  /**
   * Webhook event source for handling HTTP webhook requests.
   * Creates endpoints that can receive HTTP requests from external services.
   */
  readonly webhook: webhookEventSource.Webhook = new webhookEventSource
    .Webhook();

  /**
   * Cron event source for scheduling recurring tasks.
   * Supports standard cron expressions and convenience methods for common intervals.
   */
  readonly cron: cronEventSource.Cron = new cronEventSource.Cron();

  /**
   * GitHub event source for repository and organization events.
   * Listens to GitHub webhooks for events like pull requests, issues, and pushes.
   */
  readonly github: githubEventSource.Github = new githubEventSource.Github();

  /**
   * Streak CRM event source for pipeline and box events.
   * Monitors changes in Streak CRM pipelines, boxes, tasks, and emails.
   */
  readonly streak: streakEventSource.Streak = new streakEventSource.Streak();

  /**
   * Stripe event source for payment and subscription events.
   * Handles Stripe webhooks for customer, payment, and subscription lifecycle events.
   */
  readonly stripe: stripeEventSource.Stripe = new stripeEventSource.Stripe();

  /**
   * Intercom event source for customer conversation events.
   * Tracks events in Intercom workspaces like conversation closures.
   */
  readonly intercom: intercomEventSource.Intercom = new intercomEventSource.Intercom();
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
 * import { glue } from "@glue/runtime";
 *
 * glue.stripe.onCustomerCreated((event) => {
 *   console.log("New customer:", event.data.object.email);
 * });
 * ```
 */
export const glue: Glue = new Glue();
