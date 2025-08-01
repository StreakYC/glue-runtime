import { type CommonTriggerOptions, registerEventListener } from "../../runtimeSupport.ts";

/**
 * Represents a Gmail message event triggered when a new email is received.
 *
 * This event is fired whenever a new message is added to the connected Gmail account's inbox.
 *
 * @example
 * ```typescript
 * function handleNewEmail(event: GmailMessageEvent) {
 *   console.log(`New email received: ${event.subject}`);
 * }
 * ```
 */
export interface GmailMessageEvent {
  /** The type of Gmail event - currently only "messageAdded" is supported */
  type: "messageAdded";
  /** The subject line of the email message */
  subject: string;
}

/**
 * Options specific to Gmail event triggers.
 *
 * Extends the common trigger options with Gmail-specific configuration
 * for filtering events by account.
 */
export type GmailTriggerOptions = CommonTriggerOptions & {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
  accountEmailAddress?: string;
};

/**
 * Internal configuration for Gmail event listeners.
 * @internal
 */
export interface GmailConfig {
  /** Optional email address filter */
  accountEmailAddress?: string;
}

/**
 * Gmail event source for listening to email events.
 *
 * Provides methods to register glue handlers that are triggered when new emails
 * arrive in connected Gmail accounts. This can be used to automate email
 * processing, notifications, and workflows.
 *
 * @example
 * ```typescript
 * // React to all new emails
 * glue.gmail.onMessage((event) => {
 *   console.log(`New email: ${event.subject}`);
 * });
 *
 * // Filter to specific account
 * glue.gmail.onMessage((event) => {
 *   // Process customer support emails
 *   if (event.subject.includes("Support Request")) {
 *     createSupportTicket(event);
 *   }
 * }, { accountEmailAddress: "support@company.com" });
 * ```
 */
export class Gmail {
  /**
   * Registers a glue handler for new Gmail messages.
   *
   * The glue handler function will be called whenever a new email arrives in the
   * connected Gmail account(s). You can optionally filter events to a specific
   * email account using the options parameter.
   *
   * @param fn - Handler function called when a new email is received
   * @param options - Optional trigger configuration including account filtering
   *
   * @example
   * ```typescript
   * // Basic email handler
   * glue.gmail.onMessage((event) => {
   *   console.log(`New email received: ${event.subject}`);
   * });
   *
   * // With account filtering
   * glue.gmail.onMessage((event) => {
   *   // Only processes emails to sales@company.com
   *   logSalesInquiry(event.subject);
   * }, {
   *   accountEmailAddress: "sales@company.com",
   *   label: "sales-email-handler"
   * });
   *
   * // Automated response example
   * glue.gmail.onMessage(async (event) => {
   *   if (event.subject.toLowerCase().includes("out of office")) {
   *     await sendAutoReply(event);
   *   }
   * });
   * ```
   */
  onMessage(
    fn: (event: GmailMessageEvent) => void,
    options?: GmailTriggerOptions,
  ): void {
    const config: GmailConfig = {
      accountEmailAddress: options?.accountEmailAddress,
    };
    registerEventListener("gmail", fn, config, options);
  }
}
