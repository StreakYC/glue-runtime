import {
  type CommonTriggerOptions,
  registerEvent,
} from "../../../runtimeSupport.ts";

export class Github {
  onEvent(
    fn: (events: string[]) => void,
    options?: CommonTriggerOptions,
  ): void {
    registerEvent("github", fn, options);
  }
}
