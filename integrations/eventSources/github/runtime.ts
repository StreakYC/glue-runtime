import {
  type CommonTriggerOptions,
  registerEvent,
} from "../../../runtimeSupport.ts";

export interface GithubTriggerOptions extends CommonTriggerOptions {
  events: string[];
  repo: string;
}

export class Github {
  onEvent(
    fn: (event: unknown) => void,
    options?: GithubTriggerOptions,
  ): void {
    registerEvent("github", fn, options);
  }
}
