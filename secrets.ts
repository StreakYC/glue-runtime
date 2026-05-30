import { registerSecretFetcher, type SecretFetcher } from "./runtimeSupport.ts";

export type { SecretFetcher } from "./runtimeSupport.ts";

/** Options for {@link Secrets.createSecretFetcher}. */
export interface SecretFetcherOptions {
  /** Description that appears for the secret when configuring a Glue. */
  description?: string;
}

/**
 * Utilities for fetching secret values at runtime. This works as an alternative
 * to environment variables.
 *
 * @example
 * ```typescript
 * import ExampleClient from "npm:example";
 *
 * const exampleApiKey = glue.secrets.createSecretFetcher("example api key");
 *
 * glue.webhook.onPost(async () => {
 *   const example = new ExampleClient(await exampleApiKey.get());
 *   // ...
 * });
 * ```
 */
export class Secrets {
  /**
   * Registers a secret fetcher. This method must be called at the top level of
   * your code. The returned fetcher's `.get()` method may only be called inside
   * event handlers.
   *
   * During development or deployment (`glue dev` / `glue deploy`), the user
   * will be prompted to provide values for any registered secrets that have not
   * yet been configured.
   *
   * @example
   * ```typescript
   * import ExampleClient from "npm:example";
   *
   * const exampleApiKey = glue.secrets.createSecretFetcher("example api key");
   *
   * glue.webhook.onPost(async () => {
   *   const example = new ExampleClient(await exampleApiKey.get());
   *   // ...
   * });
   * ```
   */
  createSecretFetcher(
    name: string,
    options?: SecretFetcherOptions,
  ): SecretFetcher {
    return registerSecretFetcher({
      name,
      description: options?.description,
    });
  }
}
