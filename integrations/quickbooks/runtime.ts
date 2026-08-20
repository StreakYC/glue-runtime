import type { CommonCredentialFetcherOptions } from "../../common.ts";
import {
  type AccessTokenCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
} from "../../runtimeSupport.ts";

export interface QuickBooksCredential extends AccessTokenCredential {
  expiresAt: number;
  realmId: string;
}

export interface QuickBooksCredentialFetcherOptions extends CommonCredentialFetcherOptions {
  /** Optional QuickBooks company ID to select a connected company. */
  realmId?: string;
}

export class QuickBooks {
  /**
   * Creates a credential fetcher for the QuickBooks Online Accounting API.
   * The returned credential includes the selected company ID.
   */
  createCredentialFetcher(
    options?: QuickBooksCredentialFetcherOptions,
  ): CredentialFetcher<QuickBooksCredential> {
    return registerCredentialFetcher<QuickBooksCredential>("quickbooks", {
      description: options?.description,
      accountSelector: options?.realmId
        ? { ...options.accountSelector, realmId: options.realmId }
        : options?.accountSelector,
    });
  }
}
