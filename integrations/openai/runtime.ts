import type { CommonCredentialFetcherOptions } from "../../common.ts";
import {
  type ApiKeyCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
} from "../../runtimeSupport.ts";

export interface OpenAICredentialFetcherOptions extends CommonCredentialFetcherOptions {
  /** Optional API key name to select the appropriate OpenAI account. */
  apiKeyName?: string;
}

/**
 * OpenAI service for fetching API key credentials.
 *
 * @example
 * ```typescript
 * import OpenAIClient from "jsr:@openai/openai";
 *
 * const fetcher = glue.openai.createCredentialFetcher({ apiKeyName: "primary-openai" });
 *
 * glue.webhook.onPost(async () => {
 *   const cred = await fetcher.get();
 *   const client = new OpenAIClient({ apiKey: cred.apiKey });
 *   const response = await client.responses.create({
 *     model: "gpt-5-mini",
 *     input: "Say hello from Glue.",
 *   });
 *   console.log(response.output_text);
 * });
 * ```
 *
 * @see https://developers.openai.com/api/reference/overview#authentication
 */
export class OpenAI {
  createCredentialFetcher(
    options?: OpenAICredentialFetcherOptions,
  ): CredentialFetcher<ApiKeyCredential> {
    return registerCredentialFetcher<ApiKeyCredential>("openai", {
      description: options?.description,
      selector: options?.apiKeyName,
    });
  }
}
