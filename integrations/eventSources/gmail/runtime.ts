import { type CommonTriggerOptions, registerEventListener } from "../../../runtimeSupport.ts";

export interface GmailMessageEvent {
  type: "messageAdded";
  subject: string;
}

export type GmailTriggerOptions = CommonTriggerOptions & {
  accountEmailAddress?: string;
};

export interface GmailConfig {
  accountEmailAddress?: string;
}

export class Gmail {
  onMessage(
    fn: (event: GmailMessageEvent) => void,
    options?: GmailTriggerOptions,
  ): void {
    const config: GmailConfig = {
      accountEmailAddress: options?.accountEmailAddress,
    };
    registerEventListener("gmail", fn, config, options);
  }
}
