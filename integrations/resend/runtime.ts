import type { CommonAccountInjectionOptions } from "../../common.ts";
import { type AccountFetcher, type ApiKeyCredential, registerAccountInjection } from "../../runtimeSupport.ts";

export interface ResendAccountInjectionOptions extends CommonAccountInjectionOptions {
  /** Optional API key name to select appropriate api key. */
  apiKeyName?: string;
}

/**
 * Resend email service for sending emails.
 *
 * @example
 * ```typescript
 * // Get a credential fetcher for Resend
 * const fetcher = glue.resend.createCredentialFetcher({teamName: "team-name"});
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
  createCredentialFetcher(options?: ResendAccountInjectionOptions): AccountFetcher<ApiKeyCredential> {
    return registerAccountInjection<ApiKeyCredential>("resend", {
      description: options?.description,
      selector: options?.apiKeyName,
    });
  }
}
