import z from "zod";
import { type CommonAccountInjectionOptions, CommonTriggerBackendConfig, type CommonTriggerOptions } from "../../common.ts";
import { type AccessTokenCredential, type CredentialFetcher, registerAccountInjection, registerEventListener } from "../../runtimeSupport.ts";
import type { AllMessageEvents, GenericMessageEvent, SlackEvent } from "@slack/types";
import { type ChatPostMessageResponse, ErrorCode, type WebAPIPlatformError, WebClient } from "@slack/web-api";

/** Various types of events from Slack */
export type SlackEventType = SlackEvent["type"];

/** The webhook payload from Slack for all events */
export type SlackEventWebhook<T extends SlackEvent> = {
  type: "event_callback";
  event: T;
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
export const SlackEventWebhook: z.ZodType<SlackEventWebhook<SlackEvent>> = z.object({
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
  /** Optional team ID or workspace to listen for events on */
  teamId?: string;

  /** Optional channel ID to filter events on. If provided, only events from this channel will be listened to.  */
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
export const SlackTriggerBackendConfig: z.ZodType<SlackTriggerBackendConfig> = CommonTriggerBackendConfig.extend({
  teamId: z.string().optional(),
  events: z.array(z.custom<SlackEventType>()),
  channels: z.array(z.string()).optional(),
});

export interface SlackCredentialFetcherOptions extends CommonAccountInjectionOptions {
  scopes: string[];
  teamId?: string;
}

/**
 * Slack event source for all Slack events.
 *
 * Provides methods to register glue handlers for Slack webhook events,
 * allowing you to react to new messages, new channels, new users, etc.
 *
 * @example
 * ```typescript
 * // Monitor closed conversations
 * glue.slack.onNewMessage((webhook) => {
 *   const msg = webhook.event.text;
 *   console.log(msg);
 * });
 *
 * // Listen for multiple event types
 * glue.slack.onEvents([
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
   * combination of Slack event topics. These events that are delivered
   * are based on what is visible to the user that is authenticated with
   * the account.
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
  onEvents<T extends SlackEventType>(
    events: T[],
    fn: (event: SlackEventWebhook<Extract<SlackEvent, { type: T }>>) => void,
    options?: SlackTriggerOptions,
  ): void {
    const config: SlackTriggerBackendConfig = {
      events: events,
      teamId: options?.teamId,
      channels: options?.channelId ? [options.channelId] : undefined,
    };
    registerEventListener("slack", fn, config);
  }

  /**
   * Registers a glue handler for new user visible messages.
   *
   * Triggered when a message is posted to a channel visible to the user.
   */
  onNewMessage(
    fn: (event: SlackEventWebhook<GenericMessageEvent>) => void,
    options?: SlackTriggerOptions,
  ): void {
    this.onEvents(["message"], fn as (event: SlackEventWebhook<AllMessageEvents>) => void, options);
  }

  /**
   * Creates a credential fetcher function for Slack API authentication. Use in
   * conjunction with the Slack client library.
   *
   * This method returns a function that, when called, provides access token
   * credentials for authenticating with the Slack API as a **user**. The function
   * may only be called within an event handler.
   *
   * @example
   * ```typescript
   * const fetcher = glue.slack.createUserCredentialFetcher({scopes: ["chat:write"]});
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await fetcher.get();
   *   const client = new WebClient(cred.accessToken);
   *   client.chat.postMessage({
   *     channel: "C0123456789",
   *     text: "Hello, world!",
   *   });
   * });
   * ```
   */
  createUserCredentialFetcher(options: SlackCredentialFetcherOptions): CredentialFetcher<AccessTokenCredential> {
    return registerAccountInjection<AccessTokenCredential>("slack", {
      description: options.description,
      selector: options.teamId,
      scopes: options.scopes,
    });
  }

  /**
   * Creates a credential fetcher function for Slack API authentication. Use in
   * conjunction with the Slack client library.
   *
   * This method returns a function that, when called, provides access token
   * credentials for authenticating with the Slack API as a **bot**. The function
   * may only be called within an event handler.
   *
   * @example
   * ```typescript
   * const fetcher = glue.slack.createBotCredentialFetcher({scopes: ["chat:write"]});
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await fetcher.get();
   *   const client = new WebClient(cred.accessToken);
   *   client.chat.postMessage({
   *     channel: "C0123456789",
   *     text: "Hello, world!",
   *   });
   * });
   * ```
   */
  createBotCredentialFetcher(options: SlackCredentialFetcherOptions): CredentialFetcher<AccessTokenCredential> {
    return registerAccountInjection<AccessTokenCredential>("slackBot", {
      description: options.description,
      selector: options.teamId,
      scopes: options.scopes,
    });
  }

  /**
   * Creates a credential fetcher function for Slack API authentication to
   * send messages as a **user**. Use in conjunction with the Slack client
   * library.
   *
   * The function may only be called within an event handler.
   *
   * @example
   * ```typescript
   * const fetcher = glue.slack.createUserMessageSendingCredentialFetcher();
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await fetcher.get();
   *   const client = new WebClient(cred.accessToken);
   *   client.chat.postMessage({
   *     channel: "C0123456789",
   *     text: "Hello, world!",
   *   });
   * });
   * ```
   */
  createUserMessageSendingCredentialFetcher(options?: Omit<SlackCredentialFetcherOptions, "scopes">): CredentialFetcher<AccessTokenCredential> {
    return this.createUserCredentialFetcher({
      ...options,
      scopes: ["chat:write"],
    });
  }

  /**
   * Creates a credential fetcher function for Slack API authentication to
   * send messages as a **bot**. Use in conjunction with the Slack client
   * library.
   *
   * The function may only be called within an event handler.
   *
   * @example
   * ```typescript
   * const fetcher = glue.slack.createBotMessageSendingCredentialFetcher();
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await fetcher.get();
   *   const client = new WebClient(cred.accessToken);
   *   client.chat.postMessage({
   *     channel: "C0123456789",
   *     text: "Hello, world!",
   *   });
   * });
   * ```
   */
  createBotMessageSendingCredentialFetcher(options?: Omit<SlackCredentialFetcherOptions, "scopes">): CredentialFetcher<AccessTokenCredential> {
    return this.createBotCredentialFetcher({
      ...options,
      scopes: [
        "chat:write",
        "chat:write.customize",
        "channels:join",
        "channels:read",
        "groups:read",
        "mpim:read",
        "im:read",
      ],
    });
  }

  /**
   * Sends a message as a bot to a channel. Works for any channel that a bot can join.
   *
   * This method will make the bot join the channel if it is not already.
   *
   * Requires the following scopes: `chat:write`, `channels:join`, `channels:read`, `groups:read`, `mpim:read`, `im:read`
   *
   * @param credentialFetcher The credential fetcher to use to get the access token
   * @param channel The channel to send the message to. You can provide the channel name directly or an object that has the channel id. You can get channel ids using the `getChannelId` helper function
   * @param text The text of the message to send
   * @param threadTs The parent of the message you want to send. Used when you want to thread messages.
   */
  async sendMessageAsBot(
    credentialFetcher: CredentialFetcher<AccessTokenCredential>,
    channel: string | { id: string },
    text: string,
    threadTs?: string,
  ): Promise<ChatPostMessageResponse> {
    const cred = await credentialFetcher.get();
    const client = new WebClient(cred.accessToken);

    let channelId: string;
    if (typeof channel === "string") {
      channelId = await this.getChannelId(client, channel);
    } else {
      channelId = channel.id;
    }

    try {
      return await client.chat.postMessage({ channel: channelId, text: text, thread_ts: threadTs });
    } catch (e) {
      if (isPlatformError(e)) {
        if (e.data.error === "not_in_channel") {
          await client.conversations.join({
            channel: channelId,
          });
          return await client.chat.postMessage({ channel: channelId, text: text, thread_ts: threadTs });
        }
      }
      throw e;
    }
  }

  /**
   * The slack API typically uses channel ids in all of its methods. Users typically know the channel name they want to use but not the id.
   * This function converts the name to an id. This method can be called repeatedly because the channel id to name mapping is cached.
   * @param client an authenticated slack client
   * @param channelName name of a channel
   * @returns the id of the channel or undefined if it doesn't exist.
   */
  async getChannelId(client: WebClient, channelName: string): Promise<string> {
    const cachedResult = cachedChannelNamesToIds?.get(channelName);
    if (cachedResult) {
      return cachedResult;
    }

    // if not in the cache, refresh the cache
    cachedChannelNamesToIds = await getChannelNamesToIds(client);

    const newCachedResult = cachedChannelNamesToIds.get(channelName);
    if (!newCachedResult) {
      throw new Error("Channel not found");
    }
    return newCachedResult;
  }
}

let cachedChannelNamesToIds: Map<string, string> | undefined;

const isPlatformError = (e: unknown): e is WebAPIPlatformError =>
  // deno-lint-ignore no-explicit-any
  typeof e === "object" && e !== null && (e as any).code === ErrorCode.PlatformError;

async function getChannelNamesToIds(client: WebClient): Promise<Map<string, string>> {
  const channelNamesToId = new Map<string, string>();
  let cursor: string | undefined;
  while (true) {
    const conversationsList = await client.conversations.list({
      types: "public_channel,private_channel,mpim,im",
      limit: 999,
      cursor: cursor,
    });
    if (!conversationsList.ok) {
      throw new Error("Failed to list Slack channels");
    }
    conversationsList.channels?.forEach((c) => {
      if (c.name != null && c.id != null) {
        channelNamesToId.set(c.name, c.id);
      }
    });
    if (!conversationsList.response_metadata?.next_cursor) {
      break;
    }
    cursor = conversationsList.response_metadata.next_cursor;
  }
  return channelNamesToId;
}
