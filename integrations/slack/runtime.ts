import z from "zod";
import { type CommonAccountInjectionOptions, type CommonTriggerBackendConfig, CommonTriggerOptions } from "../../common.ts";
import { type AccessTokenCredential, type AccountFetcher, registerAccountInjection, registerEventListener } from "../../runtimeSupport.ts";
import type { SlackEvent } from "@slack/types";

/** Various types of events from Slack */
export type SlackEventType = SlackEvent["type"];

/** The webhook payload from Slack for all events */
export type SlackEventWebhook = {
  type: "event_callback";
  event: SlackEvent;
  team_id: string;
  event_id: string;
  event_context: string;
  event_time: number;
  channel?: string;
  authorizations: {
    team_id: string;
    user_id: string;
  }[];
};

/** The webhook payload from Slack for all events */
export const SlackEventWebhook: z.ZodType<SlackEventWebhook> = z.object({
  type: z.literal("event_callback"),
  event: z.custom<SlackEvent>(),
  team_id: z.string(),
  event_id: z.string(),
  event_context: z.string(),
  event_time: z.number(),
  channel: z.string().optional(),
  authorizations: z.array(z.object({
    team_id: z.string(),
    user_id: z.string(),
  })),
});

export interface SlackTriggerOptions extends CommonTriggerOptions {
  /**
   * The team ID or workspace to listen for events on
   */
  teamId?: string;

  /**
   * The channel ID to filter events on. If not provided, all channels will be listened to.
   */
  channelId?: string;
}

export interface SlackTriggerBackendConfig extends CommonTriggerBackendConfig {
  /** The team ID or workspace to listen for events on */
  teamId?: string;
  /** Array of user events to listen for */
  events: SlackEventType[];
  /** Optional channel IDs to filter events */
  channels?: string[];
}
export const SlackTriggerBackendConfig: z.ZodType<SlackTriggerBackendConfig> = CommonTriggerOptions.extend({
  teamId: z.string().optional(),
  events: z.array(z.custom<SlackEventType>()),
  channels: z.array(z.string()).optional(),
});

interface SlackCredentialFetcherOptions extends CommonAccountInjectionOptions {
  scopes: string[];
  teamId?: string;
}

/**
 * Slack event source for all slack events.
 *
 * Provides methods to register glue handlers for Slack webhook events,
 * allowing you to react to new messages, new channels, new users, etc.
 *
 * @example
 * ```typescript
 * // Monitor closed conversations
 * glue.slack.onNewUserVisibleMessage((webhook) => {
 *   const msg = webhook.event.text;
 *   console.log(msg);
 * });
 *
 * // Listen for multiple event types
 * glue.slack.onUserEvents([
 *   "message",
 *   "channel_created"
 * ], (webhook) => {
 *   if (webhook.event.type === "channel_created") {
 *     console.log(webhook.event.channel);
 *   } else {
 *     console.log(webhook.event.text);
 *   }
 * });
 * ```
 */
export class Slack {
  /**
   * Registers a glue handler for specific Slack webhook events.
   *
   * This is the most flexible method, allowing you to listen for any
   * combination of Slack event topics.
   *
   * @param events - Array of Slack event topics to listen for
   * @param fn - Handler function called when any of the specified events occur
   * @param options - Optional trigger configuration including workspace filtering
   *
   * @example
   * ```typescript
   * // Listen for conversation events
   * glue.slack.onEvent([
   *   "message",
   *   "channel_created"
   * ], (webhook) => {
   *   switch (webhook.event.type) {
   *     case "message":
   *       console.log(webhook.event.text);
   *       break;
   *     case "channel_created":
   *       console.log(webhook.event.channel);
   *       break;
   *   }
   * });
   * ```
   *
   * @see https://docs.slack.dev/reference/events - Full list of event types
   */
  onEvents(events: SlackEventType[], fn: (event: SlackEventWebhook) => void, options?: SlackTriggerOptions): void {
    const config: SlackTriggerBackendConfig = {
      ...options,
      events: events,
      teamId: options?.teamId,
      channels: undefined,
    };
    registerEventListener("slack", fn, config);
  }

  /**
   * Registers a glue handler for new user visible messages.
   *
   * Triggered when a message is posted to a channel visible to the user.
   */
  onNewMessage(
    fn: (event: SlackEventWebhook) => void,
    options?: SlackTriggerOptions,
  ): void {
    this.onEvents(["message"], fn, options);
  }

  createUserCredentialFetcher(options: SlackCredentialFetcherOptions): AccountFetcher<AccessTokenCredential> {
    return registerAccountInjection<AccessTokenCredential>("slack", {
      description: options.description,
      selector: options.teamId,
      scopes: options.scopes,
    });
  }

  createBotCredentialFetcher(options: SlackCredentialFetcherOptions): AccountFetcher<AccessTokenCredential> {
    return registerAccountInjection<AccessTokenCredential>("slackBot", {
      description: options.description,
      selector: options.teamId,
      scopes: options.scopes,
    });
  }

  createUserMessageSendingCredentialFetcher(options?: Omit<SlackCredentialFetcherOptions, "scopes">): AccountFetcher<AccessTokenCredential> {
    return this.createUserCredentialFetcher({
      ...options,
      scopes: ["chat:write"],
    });
  }

  createBotMessageSendingCredentialFetcher(options?: Omit<SlackCredentialFetcherOptions, "scopes">): AccountFetcher<AccessTokenCredential> {
    return this.createBotCredentialFetcher({
      ...options,
      scopes: ["chat:write", "chat:write.customize"],
    });
  }
}
