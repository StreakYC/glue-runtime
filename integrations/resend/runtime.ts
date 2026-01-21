import type { CommonCredentialFetcherOptions } from "../../common.ts";
import {
  type ApiKeyCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
} from "../../runtimeSupport.ts";

export interface ResendCredentialFetcherOptions extends CommonCredentialFetcherOptions {
  /** Optional API key name to select appropriate api key. */
  apiKeyName?: string;
}

/**
 * Resend email service for sending emails.
 *
 * @example
 * ```typescript
 * // Get a credential fetcher for Resend
 * const fetcher = glue.resend.createCredentialFetcher({apiKeyName: "api-key-name"});
 *
 * // Send an email
 * glue.webhook.onGet(async (_event) => {
 *   const cred = await fetcher.get();
 *   const client = new Resend(cred.accessToken);
 *   const email = await client.emails.send({
 *     from: "hello@example.com",
 *     to: "test@example.com",
 *     subject: "Hello, world!",
 *     text: "Hello, world!",
 *   });
 * });
 * ```
 *
 * @see https://resend.com/docs/api-reference
 */
export class Resend {
  createCredentialFetcher(
    options?: ResendCredentialFetcherOptions,
  ): CredentialFetcher<ApiKeyCredential> {
    return registerCredentialFetcher<ApiKeyCredential>("resend", {
      description: options?.description,
      selector: options?.apiKeyName,
    });
  }
}
