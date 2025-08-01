import { type AccessTokenCredential, type CommonAccountInjectionOptions, registerAccountInjection } from "../../runtimeSupport.ts";

export interface GoogleAccountInjectionOptions extends CommonAccountInjectionOptions {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
  accountEmailAddress?: string;
}

/**
 * Internal configuration for Google account injections.
 * @internal
 */
export interface GoogleAccountInjectionConfig {
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
export class Google {
  getCredentialFetcher(options?: GoogleAccountInjectionOptions): () => Promise<AccessTokenCredential> {
    const config: GoogleAccountInjectionConfig = {
      accountEmailAddress: options?.accountEmailAddress,
    };
    const fetcher = registerAccountInjection<AccessTokenCredential>("google", config, options);
    return fetcher;
  }
}
