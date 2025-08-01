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

export class Google {
  getCredentialFetcher(options?: GoogleAccountInjectionOptions): () => Promise<AccessTokenCredential> {
    const config: GoogleAccountInjectionConfig = {
      accountEmailAddress: options?.accountEmailAddress,
    };
    const fetcher = registerAccountInjection<AccessTokenCredential>("google", config, options);
    return fetcher;
  }
}
