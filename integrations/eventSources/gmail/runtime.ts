import {
  type CommonTriggerOptions,
  registerEvent,
} from "../../../runtimeSupport.ts";

export interface GmailMessageEvent {
  type: "messageAdded";
  subject: string;
}

export type GmailTriggerOptions = CommonTriggerOptions & GmailConfig;

export interface GmailConfig {
  accountEmailAddress?: string;
}

export class Gmail {
  onMessage(
    fn: (event: GmailMessageEvent) => void,
    options?: GmailTriggerOptions,
  ): void {
    registerEvent("gmail", fn, options);
  }
}
