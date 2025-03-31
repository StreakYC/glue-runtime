import {
  type CommonTriggerOptions,
  registerEvent,
} from "../../../runtimeSupport.ts";

export type GithubTriggerOptions = CommonTriggerOptions & GithubConfig;

export interface GithubConfig {
  repo: string;
  events: string[];
  username?: string;
}

export interface GithubEvent {
  event: string;
  payload: unknown;
}

export class Github {
  onEvent(
    fn: (event: GithubEvent) => void,
    options?: GithubTriggerOptions,
  ): void {
    registerEvent("github", fn, options);
  }
}
