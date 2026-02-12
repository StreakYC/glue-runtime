import z from "zod";
import type { Intercom as IntercomTypes } from "intercom-client";
import { type CommonTriggerBackendConfig, CommonTriggerOptions } from "../../common.ts";
import { registerEventListener } from "../../runtimeSupport.ts";

export interface IntercomTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional Intercom workspace ID to select the appropriate account.
   */
  workspaceId?: string;
}

interface IntercomWebhookTypeMap {
  admin: IntercomTypes.Admin;
  article: IntercomTypes.Article;
  company: IntercomTypes.Company;
  contact: IntercomTypes.Contact;
  conversation: IntercomTypes.Conversation;
  conversation_part: IntercomTypes.ConversationPart;
  event: IntercomTypes.DataEvent;
  job: IntercomTypes.Jobs;
  note: IntercomTypes.Note;
  segment: IntercomTypes.Segment;
  tag: IntercomTypes.Tag;
  team: IntercomTypes.Team;
  ticket: IntercomTypes.Ticket;
  visitor: IntercomTypes.Visitor;
}

export type IntercomEvent<TTopic extends string> = {
  [K in TTopic]: {
    type: "notification_event";
    topic: K;
    id: string;
    app_id: string;
    created_at: number;
    delivery_attempts: number;
    first_sent_at: number;
    data: {
      item: K extends `${infer Prefix}.${string}`
        ? Prefix extends keyof IntercomWebhookTypeMap
          ? IntercomWebhookTypeMap[Prefix] & { type: Prefix }
        : unknown
        : unknown;
    };
  };
}[TTopic];

export interface IntercomTriggerBackendConfig extends CommonTriggerBackendConfig {
  /** Array of Intercom event topics to listen for */
  events: string[];
  /** Optional workspace ID filter */
  workspaceId?: string;
}

export const IntercomTriggerBackendConfig: z.ZodType<IntercomTriggerBackendConfig> =
  CommonTriggerOptions.extend({
    events: z.array(z.string()),
    workspaceId: z.string().optional(),
  });

/**
 * Intercom event source for customer conversation and contact events.
 *
 * Provides methods to register glue handlers for Intercom webhook events,
 * allowing you to react to conversation updates, contact changes,
 * and other activities in your Intercom workspace.
 *
 * @example
 * ```typescript
 * // Monitor closed conversations
 * glue.intercom.onConversationClosed((event) => {
 *   const conversation = event.data.item; // typed Intercom.Conversation
 *   logConversationMetrics(conversation);
 * });
 *
 * // Listen for multiple event types
 * glue.intercom.onEvent([
 *   "contact.created",
 *   "conversation.admin.closed"
 * ], (event) => {
 *   if (event.topic === "contact.created") {
 *     syncNewContactToCRM(event.data.item);
 *   } else {
 *     updateResolutionMetrics(event.data.item);
 *   }
 * });
 * ```
 */
export class Intercom {
  /**
   * Registers a glue handler for specific Intercom webhook events.
   *
   * This is the most flexible method, allowing you to listen for any
   * combination of Intercom event topics.
   *
   * @param events - Array of Intercom event topics to listen for
   * @param fn - Handler function called when any of the specified events occur
   * @param options - Optional trigger configuration including workspace filtering
   *
   * @example
   * ```typescript
   * // Listen for conversation events
   * glue.intercom.onEvent([
   *   "conversation.admin.closed",
   *   "conversation.admin.assigned",
   *   "conversation.admin.replied"
   * ], (event) => {
   *   const conversation = event.data.item;
   *
   *   switch (event.topic) {
   *     case "conversation.admin.closed":
   *       // Track resolution time
   *       trackResolutionMetrics(conversation);
   *       break;
   *     case "conversation.admin.assigned":
   *       // Notify assigned admin
   *       notifyAdminOfAssignment(conversation.assignee_id);
   *       break;
   *     case "conversation.admin.replied":
   *       // Update response time metrics
   *       updateResponseMetrics(conversation);
   *       break;
   *   }
   * });
   * ```
   *
   * @see https://developers.intercom.com/intercom-api-reference/reference/webhook-topics - Full list of event types
   */
  onEvent<T extends string>(
    events: T[],
    fn: (event: IntercomEvent<T>) => void,
    options?: IntercomTriggerOptions,
  ): void {
    const config: IntercomTriggerBackendConfig = {
      ...options,
      events,
      workspaceId: options?.workspaceId,
    };
    registerEventListener("intercom", fn, config);
  }

  /**
   * Registers a glue handler for conversation closed events.
   *
   * Triggered when an admin closes a conversation in Intercom.
   * This is useful for tracking support metrics, sending follow-up
   * surveys, or updating external systems.
   */
  onConversationClosed(
    fn: (event: IntercomEvent<"conversation.admin.closed">) => void,
    options?: IntercomTriggerOptions,
  ): void {
    this.onEvent(["conversation.admin.closed"], fn, options);
  }
}
