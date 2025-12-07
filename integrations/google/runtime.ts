import type { CommonAccountInjectionOptions } from "../../common.ts";
import { type AccessTokenCredential, type CredentialFetcher, registerAccountInjection } from "../../runtimeSupport.ts";

export interface GoogleAccountInjectionOptions extends CommonAccountInjectionOptions {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
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
   * const googleCredFetcher = glue.google.createCredentialFetcher();
   *
   * // Use the fetcher to get credentials when needed
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await googleCredFetcher();
   *   console.log("Google access token:", cred);
   *   // Use cred.accessToken for API calls
   * });
   * ```
   */
  createCredentialFetcher(options: GoogleAccountInjectionOptions): CredentialFetcher<AccessTokenCredential> {
    return registerAccountInjection<AccessTokenCredential>("google", {
      description: options.description,
      selector: options.accountEmailAddress,
      scopes: options.scopes,
    });
  }
}
