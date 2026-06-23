import type { CommonCredentialFetcherOptions } from "../../common.ts";
import {
  type AccessTokenCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
} from "../../runtimeSupport.ts";

export interface GoogleCredentialFetcherOptions extends CommonCredentialFetcherOptions {
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
   * Creates a credential fetcher for Google API authentication.
   *
   * This method returns an object with a `.get()` method that provides access
   * token credentials for authenticating with Google APIs. The `.get()` method
   * may only be called within an event handler.
   *
   * @example
   * ```typescript
   * import { glue } from "jsr:@streak-glue/runtime";
   *
   * // Create a credential fetcher
   * const googleCredFetcher = glue.google.createCredentialFetcher({
   *   scopes: ["https://www.googleapis.com/auth/drive.readonly"]
   * });
   *
   * // Use the fetcher to get credentials when needed
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await googleCredFetcher();
   *   console.log("Google access token:", cred);
   *   // Use cred.accessToken for API calls
   * });
   * ```
   */
  createCredentialFetcher(
    options: GoogleCredentialFetcherOptions,
  ): CredentialFetcher<AccessTokenCredential> {
    return registerCredentialFetcher<AccessTokenCredential>("google", {
      description: options.description,
      selector: options.accountEmailAddress,
      scopes: options.scopes,
    });
  }
}
