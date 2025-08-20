import { type AccessTokenCredential, type CommonAccountInjectionOptions, registerAccountInjection } from "../../runtimeSupport.ts";

export interface GoogleAccountInjectionOptions extends CommonAccountInjectionOptions {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
  accountEmailAddress?: string;
  scopes: string[];
}

/**
 * Internal configuration for Google account injections.
 * @internal
 */
export interface GoogleAccountInjectionConfig {
  /** Optional email address filter */
  accountEmailAddress?: string;
  scopes: string[];
}

export class Google {
  /**
   * Creates a credential fetcher function for Google API authentication.
   *
   * This method returns a function that, when called, provides access token
   * credentials for authenticating with Google APIs. The function may only be
   * called within an event handler.
   *
   * @example
   * ```typescript
   * import { glue } from "jsr:@streak-glue/runtime";
   *
   * // Create a credential fetcher
   * const googleCredFetcher = glue.google.getCredentialFetcher();
   *
   * // Use the fetcher to get credentials when needed
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await googleCredFetcher();
   *   console.log("Google access token:", cred);
   *   // Use cred.accessToken for API calls
   * });
   * ```
   */
  getCredentialFetcher(options: GoogleAccountInjectionOptions): () => Promise<AccessTokenCredential> {
    const config: GoogleAccountInjectionConfig = {
      accountEmailAddress: options.accountEmailAddress,
      scopes: options.scopes,
    };
    const fetcher = registerAccountInjection<AccessTokenCredential>("google", config, options);
    return fetcher;
  }
}
