import z from "zod";
import { type CommonTriggerBackendConfig, CommonTriggerOptions } from "../../common.ts";
import { registerEventListener } from "../../runtimeSupport.ts";

export interface IntercomTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional Intercom workspace ID to select the appropriate account.
   */
  workspaceId?: string;
}

/**
 * Represents an Intercom webhook event.
 *
 * Contains information about the event type, the affected object,
 * and the workspace where the event occurred.
 *
 * @example
 * ```typescript
 * function handleIntercomEvent(event: IntercomEvent) {
 *   console.log(`Event ${event.topic} in workspace ${event.workspaceId}`);
 *   console.log(`Affected ${event.data.type}:`, event.data.item);
 * }
 * ```
 */
export interface IntercomEvent {
  /**
   * The type of event that occurred.
   * Common topics include:
   * - "conversation.admin.closed"
   * - "conversation.admin.opened"
   * - "conversation.admin.assigned"
   * - "contact.created"
   * - "contact.deleted"
   * - "company.created"
   *
   * @see https://developers.intercom.com/intercom-api-reference/reference/webhook-topics
   */
  topic: string;

  /**
   * The event payload containing the affected object.
   */
  data: {
    /**
     * The type of Intercom object affected by this event.
     * Common types: "conversation", "contact", "company", "tag", etc.
     */
    type: string;
    /**
     * The actual Intercom object data.
     * Structure varies based on the object type.
     */
    item: Record<string, unknown>;
  };

  /**
   * The Intercom workspace ID where this event occurred.
   */
  workspaceId: string;
}

export interface IntercomTriggerBackendConfig extends CommonTriggerBackendConfig {
  /** Array of Intercom event topics to listen for */
  events: string[];
  /** Optional workspace ID filter */
  workspaceId?: string;
}

export const IntercomTriggerBackendConfig: z.ZodType<IntercomTriggerBackendConfig> = CommonTriggerOptions.extend({
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
 *   const conversation = event.data.item;
 *   logConversationMetrics(conversation);
 * });
 *
 * // Listen for multiple event types
 * glue.intercom.onEvent([
 *   "contact.created",
 *   "contact.tag.created"
 * ], (event) => {
 *   if (event.topic === "contact.created") {
 *     syncNewContactToCRM(event.data.item);
 *   } else {
 *     updateContactTags(event.data.item);
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
  onEvent(
    events: string[],
    fn: (event: IntercomEvent) => void,
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
    fn: (event: IntercomEvent) => void,
    options?: IntercomTriggerOptions,
  ): void {
    this.onEvent(["conversation.admin.closed"], fn, options);
  }
}
