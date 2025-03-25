import { type CommonTriggerOptions, registerEvent } from "../runtimeSupport.ts";

export interface GmailMessageEvent {
  type: "messageAdded";
  subject: string;
}

export class Gmail {
  onMessage(
    fn: (event: GmailMessageEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    registerEvent("gmail", fn, options);
  }
}
