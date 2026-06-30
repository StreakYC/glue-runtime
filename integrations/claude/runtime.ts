import type { CommonCredentialFetcherOptions } from "../../common.ts";
import {
  type ApiKeyCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
} from "../../runtimeSupport.ts";

export interface ClaudeCredentialFetcherOptions extends CommonCredentialFetcherOptions {
  /** Optional API key name to select the appropriate Claude account. */
  accountName?: string;
}

/**
 * Claude service for fetching API key credentials.
 *
 * @example
 * ```typescript
 * import Anthropic from "npm:@anthropic-ai/sdk@0.68";
 *
 * const fetcher = glue.claude.createCredentialFetcher({ accountName: "primary-claude" });
 *
 * glue.webhook.onPost(async () => {
 *   const cred = await fetcher.get();
 *   const client = new Anthropic({ apiKey: cred.apiKey });
 *   const message = await client.messages.create({
 *     model: "claude-sonnet-4-5",
 *     max_tokens: 128,
 *     messages: [{ role: "user", content: "Say hello from Glue." }],
 *   });
 *   console.log(message.content);
 * });
 * ```
 *
 * @see https://platform.claude.com/docs/en/api/overview
 */
export class Claude {
  createCredentialFetcher(
    options?: ClaudeCredentialFetcherOptions,
  ): CredentialFetcher<ApiKeyCredential> {
    return registerCredentialFetcher<ApiKeyCredential>("claude", {
      description: options?.description,
      selector: options?.accountName,
    });
  }
}
