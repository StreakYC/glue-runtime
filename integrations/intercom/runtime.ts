import { type CommonTriggerOptions, registerEventListener } from "../../runtimeSupport.ts";

/**
 * Options specific to Intercom event triggers.
 *
 * Extends the common trigger options with Intercom-specific configuration
 * for filtering events by workspace.
 */
export interface IntercomTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional Intercom workspace ID to select appropriate account.
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

/**
 * Internal configuration for Intercom event listeners.
 * @internal
 */
export interface IntercomConfig {
  /** Array of Intercom event topics to listen for */
  events: string[];
  /** Optional workspace ID filter */
  workspaceId?: string;
}

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
 *
 * @see https://developers.intercom.com/intercom-api-reference/reference/webhooks
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
   *
   * // Monitor contact lifecycle
   * glue.intercom.onEvent([
   *   "contact.created",
   *   "contact.deleted",
   *   "contact.email.updated"
   * ], (event) => {
   *   syncContactWithCRM(event);
   * }, { workspaceId: "your-workspace-id" });
   * ```
   *
   * @see https://developers.intercom.com/intercom-api-reference/reference/webhook-topics - Full list of topics
   */
  // generic events
  onEvent(
    events: string[],
    fn: (event: IntercomEvent) => void,
    options?: IntercomTriggerOptions,
  ): void {
    const config: IntercomConfig = {
      events,
      workspaceId: options?.workspaceId,
    };
    registerEventListener("intercom", fn, config, options);
  }

  /**
   * Registers a glue handler for conversation closed events.
   *
   * Triggered when an admin closes a conversation in Intercom.
   * This is useful for tracking support metrics, sending follow-up
   * surveys, or updating external systems.
   *
   * @param fn - Handler function called when a conversation is closed
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.intercom.onConversationClosed((event) => {
   *   const conversation = event.data.item;
   *
   *   // Extract conversation details
   *   const conversationId = conversation.id;
   *   const customerId = conversation.user.id;
   *   const closedAt = new Date(conversation.updated_at * 1000);
   *   const tags = conversation.tags?.tags || [];
   *
   *   // Track support metrics
   *   await trackSupportMetrics({
   *     conversationId,
   *     customerId,
   *     closedAt,
   *     resolutionTime: closedAt - new Date(conversation.created_at * 1000),
   *     tags: tags.map(t => t.name)
   *   });
   *
   *   // Send satisfaction survey after 1 hour
   *   if (conversation.user.email) {
   *     await scheduleSatisfactionSurvey(
   *       conversation.user.email,
   *       conversationId,
   *       { delayHours: 1 }
   *     );
   *   }
   * });
   * ```
   */
  // specific events
  onConversationClosed(
    fn: (event: IntercomEvent) => void,
    options?: IntercomTriggerOptions,
  ): void {
    this.onEvent(["conversation.admin.closed"], fn, options);
  }
}
