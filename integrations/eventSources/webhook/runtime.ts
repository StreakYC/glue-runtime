import {
  type CommonTriggerOptions,
  registerEvent,
} from "../../../runtimeSupport.ts";

export interface WebhookEvent {
  method: string;
  urlParams: Record<string, string>;
  headers: Record<string, string>;
  bodyText?: string;
}

export class Webhook {
  onWebhook(
    fn: (event: WebhookEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    registerEvent("webhook", fn, options);
  }
}
