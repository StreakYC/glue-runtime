import {
  type CommonTriggerOptions,
  registerEventListener,
} from "../../../runtimeSupport.ts";

export type WebhookTriggerOptions = CommonTriggerOptions & { method?: string };

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
    const config: WebhookConfig = {
      method: options?.method,
    };
    registerEventListener("webhook", fn, config, options);
  }
  onGet(
    fn: (event: WebhookEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    const config: WebhookConfig = {
      method: "GET",
    };
    registerEventListener("webhook", fn, config, options);
  }
  onPost(
    fn: (event: WebhookEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    const config: WebhookConfig = {
      method: "POST",
    };
    registerEventListener("webhook", fn, config, options);
  }
}
