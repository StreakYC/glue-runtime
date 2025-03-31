import {
  type CommonTriggerOptions,
  registerEventListener,
} from "../../../runtimeSupport.ts";

export type GithubTriggerOptions = CommonTriggerOptions & { username?: string };

interface GithubRepoConfig {
  repo: string;
  // org?: never;
  events: string[];
  username?: string;
}

interface GithubOrgConfig {
  org: string;
  // repo?: never;
  events: string[];
  username?: string;
}

export type GithubConfig = GithubRepoConfig | GithubOrgConfig;

export interface GithubEvent {
  event: string;
  payload: unknown;
}

export class Github {
  onRepoEvent(
    repo: string,
    events: string[],
    fn: (event: GithubEvent) => void,
    options?: GithubTriggerOptions,
  ): void {
    const config: GithubRepoConfig = {
      repo,
      events,
      username: options?.username,
    };
    registerEventListener("github", fn, config, options);
  }

  onNewPullRequest(
    repo: string,
    fn: (event: GithubEvent) => void,
    options?: GithubTriggerOptions,
  ): void {
    this.onRepoEvent(repo, ["pull_request"], fn, options);
  }

  onOrgEvent(
    org: string,
    events: string[],
    fn: (event: GithubEvent) => void,
    options?: GithubTriggerOptions,
  ): void {
    const config: GithubOrgConfig = {
      org,
      events,
      username: options?.username,
    };
    registerEventListener("github", fn, config, options);
  }
}
