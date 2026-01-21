import { z } from "zod";
import type { WebhookEventMap, WebhookEventName } from "@octokit/webhooks-types";
import {
  type AccessTokenCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
  registerEventListener,
} from "../../runtimeSupport.ts";
import {
  type CommonCredentialFetcherOptions,
  type CommonTriggerBackendConfig,
  CommonTriggerOptions,
} from "../../common.ts";

/**
 * Options specific to GitHub event triggers.
 *
 * Extends the common trigger options with GitHub-specific configuration.
 */
export interface GithubTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional GitHub username to select appropriate account.
   */
  username?: string;
}

/**
 * Configuration for listening to events on a specific GitHub repository.
 * @internal
 */
interface GithubRepoTriggerBackendConfig extends CommonTriggerBackendConfig {
  /** The owner (user or organization) of the repository */
  owner: string;
  /** The name of the repository */
  repo: string;
  /** Array of GitHub webhook event names to listen for */
  events: string[];
  /** Optional username filter */
  username?: string;
}

const GithubRepoTriggerBackendConfig: z.ZodType<GithubRepoTriggerBackendConfig> =
  CommonTriggerOptions.extend({
    owner: z.string(),
    repo: z.string(),
    events: z.array(z.string()),
    username: z.string().optional(),
  });

/**
 * Configuration for listening to events on a GitHub organization.
 * @internal
 */
interface GithubOrgTriggerBackendConfig extends CommonTriggerBackendConfig {
  /** The organization name */
  org: string;
  /** Array of GitHub webhook event names to listen for */
  events: string[];
  /** Optional username filter */
  username?: string;
}

const GithubOrgTriggerBackendConfig: z.ZodType<GithubOrgTriggerBackendConfig> = CommonTriggerOptions
  .extend({
    org: z.string(),
    events: z.array(z.string()),
    username: z.string().optional(),
  });

export type GithubTriggerBackendConfig =
  | GithubRepoTriggerBackendConfig
  | GithubOrgTriggerBackendConfig;

export const GithubTriggerBackendConfig: z.ZodType<GithubTriggerBackendConfig> = z.union([
  GithubRepoTriggerBackendConfig,
  GithubOrgTriggerBackendConfig,
]);

/**
 * Options for GitHub credential fetchers.
 */
export interface GithubCredentialFetcherOptions extends CommonCredentialFetcherOptions {
  /**
   * Optional GitHub username to select appropriate account.
   */
  username?: string;
  /**
   * The scopes to request from the GitHub API.
   */
  scopes: string[];
}

/**
 * Represents a GitHub webhook event with its type and payload.
 *
 * The payload type is automatically inferred based on the event type,
 * providing full type safety for all GitHub webhook events.
 *
 * @template T - The GitHub webhook event type
 *
 * @example
 * ```typescript
 * function handlePullRequest(event: GithubEvent<"pull_request">) {
 *   console.log(event.payload.pull_request.title);
 *   console.log(event.payload.action); // "opened" | "closed" | "synchronize" | etc.
 * }
 * ```
 */
export interface GithubEvent<T extends WebhookEventName> {
  /** The type of GitHub webhook event */
  event: T;
  /** The event payload, typed according to the event type */
  payload: WebhookEventMap[T];
}

/**
 * GitHub event source for listening to repository and organization events.
 *
 * Provides methods to register glue handlers for various GitHub webhook events,
 * including pull requests, issues, pushes, releases, and more.
 *
 * @example
 * ```typescript
 * // Listen for pull request events on a specific repository
 * glue.github.onPullRequestEvent("octocat", "hello-world", (event) => {
 *   if (event.payload.action === "opened") {
 *     console.log(`New PR opened: ${event.payload.pull_request.title}`);
 *   }
 * });
 *
 * // Listen for multiple event types
 * glue.github.onRepoEvent("owner", "repo", ["push", "release"], (event) => {
 *   switch (event.event) {
 *     case "push":
 *       console.log(`Push to ${event.payload.ref}`);
 *       break;
 *     case "release":
 *       console.log(`New release: ${event.payload.release.tag_name}`);
 *       break;
 *   }
 * });
 * ```
 */
export class Github {
  /**
   * Registers a handler for specific GitHub webhook events on a repository.
   *
   * This is the most flexible method, allowing you to listen for any combination
   * of GitHub webhook event types on a specific repository.
   *
   * @template T - The GitHub webhook event type(s) to listen for
   * @param owner - The repository owner (user or organization name)
   * @param repo - The repository name
   * @param events - Array of GitHub webhook event names to listen for
   * @param fn - Handler function called when any of the specified events occur
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Listen for issues and issue comments
   * glue.github.onRepoEvent("owner", "repo", ["issues", "issue_comment"], (event) => {
   *   if (event.event === "issues") {
   *     console.log(`Issue ${event.payload.action}: ${event.payload.issue.title}`);
   *   } else {
   *     console.log(`New comment on issue #${event.payload.issue.number}`);
   *   }
   * });
   * ```
   *
   * @see https://docs.github.com/en/webhooks/webhook-events-and-payloads
   */
  onRepoEvent<T extends WebhookEventName>(
    owner: string,
    repo: string,
    events: T[],
    fn: (event: GithubEvent<T>) => void,
    options?: GithubTriggerOptions,
  ): void {
    const config: GithubRepoTriggerBackendConfig = {
      ...options,
      owner,
      repo,
      events,
    };
    registerEventListener("github", fn, config);
  }

  /**
   * Registers a handler for specific GitHub webhook events on an organization.
   *
   * Listen for organization-wide events that aren't specific to a single repository,
   * such as organization membership changes, team updates, and more.
   *
   * @template T - The GitHub webhook event type(s) to listen for
   * @param org - The organization name
   * @param events - Array of GitHub webhook event names to listen for
   * @param fn - Handler function called when any of the specified events occur
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Monitor organization membership changes
   * glue.github.onOrgEvent("my-org", ["organization", "membership"], (event) => {
   *   if (event.event === "organization") {
   *     console.log(`Organization event: ${event.payload.action}`);
   *   }
   * });
   * ```
   *
   * @see https://docs.github.com/en/webhooks/webhook-events-and-payloads
   */
  onOrgEvent<T extends WebhookEventName>(
    org: string,
    events: T[],
    fn: (event: GithubEvent<T>) => void,
    options?: GithubTriggerOptions,
  ): void {
    const config: GithubOrgTriggerBackendConfig = {
      ...options,
      org,
      events,
    };
    registerEventListener("github", fn, config);
  }

  /**
   * Registers a glue handler specifically for pull request events.
   *
   * This is a convenience method for the common use case of monitoring
   * pull request activity on a repository.
   *
   * @param owner - The repository owner (user or organization name)
   * @param repo - The repository name
   * @param fn - Handler function called when pull request events occur
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.github.onPullRequestEvent("owner", "repo", async (event) => {
   *   const { action, pull_request } = event.payload;
   *
   *   switch (action) {
   *     case "opened":
   *       console.log(`New PR #${pull_request.number}: ${pull_request.title}`);
   *       // Auto-assign reviewers, add labels, etc.
   *       break;
   *     case "closed":
   *       if (pull_request.merged) {
   *         console.log(`PR #${pull_request.number} was merged`);
   *         // Trigger deployment, update docs, etc.
   *       }
   *       break;
   *   }
   * });
   * ```
   *
   * @see https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request
   */
  onPullRequestEvent(
    owner: string,
    repo: string,
    fn: (event: GithubEvent<"pull_request">) => void,
    options?: GithubTriggerOptions,
  ): void {
    this.onRepoEvent(owner, repo, ["pull_request"], fn, options);
  }

  /**
   * Creates a credential fetcher function for Github API authentication. Use in
   * conjunction with the Github client library.
   *
   * This method returns a function that, when called, provides access token
   * credentials for authenticating with the Github API. The function
   * may only be called within an event handler.
   *
   * @example
   * ```typescript
   * const fetcher = glue.github.createCredentialFetcher({scopes: ["repo"]});
   * glue.webhook.onGet(async (_event) => {
   *   const cred = await fetcher.get();
   *   const client = new Octokit({ auth: cred.accessToken });
   *   const user = await octokit.rest.users.getAuthenticated();
   *   console.log("User:", user.data);
   * });
   * ```
   */
  createCredentialFetcher(
    options: GithubCredentialFetcherOptions,
  ): CredentialFetcher<AccessTokenCredential> {
    return registerCredentialFetcher<AccessTokenCredential>("github", {
      description: options.description,
      selector: options.username,
      scopes: options.scopes,
    });
  }
}
