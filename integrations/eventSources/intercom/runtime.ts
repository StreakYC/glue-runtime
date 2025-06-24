import { type CommonTriggerOptions, registerEventListener } from "../../../runtimeSupport.ts";

export type IntercomTriggerOptions = CommonTriggerOptions & { workspaceId?: string };

export interface IntercomConfig {
  events: string[];
  workspaceId?: string;
}

export class Intercom {
  // generic events
  onEvent(
    events: string[],
    fn: (event: unknown) => void,
    options?: IntercomTriggerOptions,
  ): void {
    const config: IntercomConfig = {
      events,
      workspaceId: options?.workspaceId,
    };
    registerEventListener("intercom", fn, config, options);
  }

  // specific events
  onConversationClosed(
    fn: (event: unknown) => void,
    options?: IntercomTriggerOptions,
  ): void {
    this.onEvent(["conversation.admin.closed"], fn, options);
  }
}
