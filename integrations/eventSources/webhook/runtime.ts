import {
  type CommonTriggerOptions,
  registerEvent,
} from "../../../runtimeSupport.ts";

export type WebhookTriggerOptions = CommonTriggerOptions & WebhookConfig;

export interface WebhookConfig {
  method?: string;
}

export interface WebhookEvent {
  method: string;
  urlParams: Record<string, string>;
  headers: Record<string, string>;
  bodyText?: string;
}

export class Webhook {
  onWebhook(
    fn: (event: WebhookEvent) => void,
    options?: WebhookTriggerOptions,
  ): void {
    registerEvent("webhook", fn, options);
  }
}
