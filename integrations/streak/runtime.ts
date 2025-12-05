import z from "zod";
import { type CommonAccountInjectionOptions, type CommonTriggerBackendConfig, CommonTriggerOptions } from "../../common.ts";
import { type ApiKeyCredential, type CredentialFetcher, registerAccountInjection, registerEventListener } from "../../runtimeSupport.ts";

/**
 * Options specific to Streak event triggers.
 */
export interface StreakTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional email address to select appropriate account.
   */
  emailAddress?: string;
}

export interface StreakTriggerBackendConfig extends CommonTriggerBackendConfig {
  /** The Streak pipeline key to monitor for events */
  pipelineKey: string;
  /** The specific box event type to listen for */
  event: BoxEventType;
  /** Optional email address to select appropriate Streak account. */
  emailAddress?: string;
}

export const StreakTriggerBackendConfig = CommonTriggerOptions.extend({
  pipelineKey: z.string(),
  event: z.string(),
  emailAddress: z.string().optional(),
}) as z.ZodType<StreakTriggerBackendConfig>; // doing a cast only because we have a looser type for event

export interface StreakAccountInjectionOptions extends CommonAccountInjectionOptions {
  /** Optional email address to select appropriate account. */
  emailAddress?: string;
}

/**
 * Represents a Streak box event.
 *
 * Contains information about the event type and the event payload
 * with details about the affected box, pipeline, or related objects.
 *
 * @example
 * ```typescript
 * function handleStreakEvent(event: StreakEvent) {
 *   console.log(`Event ${event.event} occurred`);
 *   console.log("Event data:", event.payload);
 * }
 * ```
 */
export interface StreakEvent {
  /** The type of box event that occurred */
  event: BoxEventType;
  /** The event payload containing details about the affected objects */
  // TODO make StreakEvent be a union of specific event types with typed
  // payloads instead of having `payload: unknown`.
  payload: unknown;
}

/**
 * Streak CRM event source for pipeline and box events.
 *
 * Provides methods to register glue handlers for Streak webhook events,
 * allowing you to react to changes in your sales pipeline, including
 * box (deal) creation, stage changes, task updates, and email activity.
 *
 * @example
 * ```typescript
 * // Monitor new deals
 * glue.streak.onNewBoxCreated("pipeline-key", (event) => {
 *   console.log("New deal created:", event.payload);
 *   // Add to external systems, assign team members, etc.
 * });
 *
 * // React to box edit events
 * glue.streak.onBoxEvent("BOX_EDIT", "pipeline-key", (event) => {
 *   syncToExternalCRM(event.payload);
 * });
 * ```
 *
 * @see https://streak.readme.io/reference/webhooks
 */
export class Streak {
  /**
   * Registers a glue handler for specific Streak box events.
   *
   * This is the most flexible method, allowing you to listen for any
   * type of box event in a specific pipeline.
   *
   * @param event - The type of box event to listen for
   * @param pipelineKey - The Streak pipeline key to monitor
   * @param fn - Handler function called when the specified event occurs
   * @param options - Optional trigger configuration
   */
  onBoxEvent(
    event: BoxEventType,
    pipelineKey: string,
    fn: (event: StreakEvent) => void,
    options?: StreakTriggerOptions,
  ): void {
    const config: StreakTriggerBackendConfig = {
      ...options,
      pipelineKey,
      event,
      emailAddress: options?.emailAddress,
    };
    registerEventListener("streak", fn, config);
  }

  /**
   * Registers a glue handler for new box creation events.
   *
   * Triggered when a new box (deal/lead) is created in the specified pipeline.
   * For example, this could be useful for initializing processes when new
   * opportunities enter your sales pipeline.
   *
   * @param pipelineKey - The Streak pipeline key to monitor
   * @param fn - Handler function called when a new box is created
   * @param options - Optional trigger configuration
   */
  onNewBoxCreated(
    pipelineKey: string,
    fn: (event: StreakEvent) => void,
    options?: StreakTriggerOptions,
  ): void {
    this.onBoxEvent("BOX_CREATE", pipelineKey, fn, options);
  }

  /**
   * Registers a handler for box stage change events.
   *
   * Triggered when a box moves to a different stage in the pipeline.
   * This is crucial for tracking deal progression and triggering
   * stage-specific workflows.
   *
   * @param pipelineKey - The Streak pipeline key to monitor
   * @param fn - Handler function called when a box changes stage
   * @param options - Optional trigger configuration
   */
  onBoxStageChanged(
    pipelineKey: string,
    fn: (event: StreakEvent) => void,
    options?: StreakTriggerOptions,
  ): void {
    this.onBoxEvent("BOX_CHANGE_STAGE", pipelineKey, fn, options);
  }

  createCredentialFetcher(options?: StreakAccountInjectionOptions): CredentialFetcher<ApiKeyCredential> {
    return registerAccountInjection<ApiKeyCredential>("streak", {
      description: options?.description,
      selector: options?.emailAddress,
    });
  }
}

/**
 * All possible Streak box event types.
 *
 * These events cover the full lifecycle of boxes (deals) in Streak,
 * including creation, updates, stage changes, and related activities
 * like tasks, comments, and email interactions.
 *
 * @see https://streak.readme.io/reference/webhook-event-types
 */
export type BoxEventType =
  /** Triggered when a new box is created in a pipeline */
  | "BOX_CREATE"
  /** Triggered when a new email address is added to a box */
  | "BOX_NEW_EMAIL_ADDRESS"
  /** Triggered when any box field is edited (name, value, notes, etc.) */
  | "BOX_EDIT"
  /** Triggered when a box moves to a different stage in the pipeline */
  | "BOX_CHANGE_STAGE"
  /** Triggered when a box is moved to a different pipeline */
  | "BOX_CHANGE_PIPELINE"
  /** Triggered when a box is deleted */
  | "BOX_DELETE"
  /** Triggered when a comment is added to a box */
  | "COMMENT_CREATE"
  /** Triggered when a new task is created in a box */
  | "TASK_CREATE"
  /** Triggered when a task is marked as complete */
  | "TASK_COMPLETE"
  /** Triggered when a task becomes due */
  | "TASK_DUE"
  /** Triggered when a new email is received and linked to a box */
  | "BOX_NEW_EMAIL_RECEIVED"
  /** Triggered when a meeting is created and linked to a box */
  | "MEETING_CREATE"
  /** Triggered when a meeting is updated */
  | "MEETING_UPDATE"
  /** Triggered when an email thread is added to a box */
  | "THREAD_ADDED_TO_BOX"
  /** Triggered when an email thread is removed from a box */
  | "THREAD_REMOVED_FROM_BOX";
