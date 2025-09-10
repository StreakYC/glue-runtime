import z from "zod";
import { CommonTriggerOptions } from "../../common.ts";
import { registerEventListener } from "../../runtimeSupport.ts";

/**
 * Represents a Gmail message event triggered when a new email is received.
 * Produced by {@link Gmail.onMessage}.
 */
export interface GmailMessageEvent {
  /** The type of Gmail event - currently only "messageAdded" is supported */
  type: "messageAdded";
  /** The subject line of the email message */
  subject: string;
}

export interface GmailTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
  accountEmailAddress?: string;
}

export type GmailTriggerBackendConfig = GmailTriggerOptions;

export const GmailTriggerBackendConfig: z.ZodType<GmailTriggerBackendConfig> = CommonTriggerOptions.extend({
  accountEmailAddress: z.string().optional(),
});

/**
 * Gmail event source for listening to email events.
 *
 * Provides methods to register glue handlers that are triggered when new emails
 * arrive in connected Gmail accounts.
 */
export class Gmail {
  /**
   * Registers a glue handler for new Gmail messages.
   *
   * The glue handler function will be called whenever a new email arrives in the
   * connected Gmail account(s).
   *
   * @example
   * ```typescript
   * // Basic email handler
   * glue.gmail.onMessage((event) => {
   *   console.log(`New email received: ${event.subject}`);
   * });
   * ```
   */
  onMessage(
    fn: (event: GmailMessageEvent) => void,
    options?: GmailTriggerOptions,
  ): void {
    registerEventListener("gmail", fn, options);
  }
}
