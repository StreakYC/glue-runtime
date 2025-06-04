import type { WebhookEventMap, WebhookEventName } from "@octokit/webhooks-types";
import { type CommonTriggerOptions, registerEventListener } from "../../../runtimeSupport.ts";

export type GithubTriggerOptions = CommonTriggerOptions & { username?: string };

interface GithubRepoConfig {
  owner: string;
  repo: string;
  events: string[];
  username?: string;
}

interface GithubOrgConfig {
  org: string;
  events: string[];
  username?: string;
}

export type GithubConfig = GithubRepoConfig | GithubOrgConfig;

export interface GithubEvent<T extends WebhookEventName> {
  event: T;
  payload: WebhookEventMap[T];
}

export class Github {
  // generic events
  onRepoEvent<T extends WebhookEventName>(
    owner: string,
    repo: string,
    events: T[],
    fn: (event: GithubEvent<T>) => void,
    options?: GithubTriggerOptions,
  ): void {
    const config: GithubRepoConfig = {
      owner,
      repo,
      events,
      username: options?.username,
    };
    registerEventListener("github", fn, config, options);
  }

  onOrgEvent<T extends WebhookEventName>(
    org: string,
    events: T[],
    fn: (event: GithubEvent<T>) => void,
    options?: GithubTriggerOptions,
  ): void {
    const config: GithubOrgConfig = {
      org,
      events,
      username: options?.username,
    };
    registerEventListener("github", fn, config, options);
  }

  // specific events
  onPullRequestEvent(
    owner: string,
    repo: string,
    fn: (event: GithubEvent<"pull_request">) => void,
    options?: GithubTriggerOptions,
  ): void {
    this.onRepoEvent(owner, repo, ["pull_request"], fn, options);
  }
}
