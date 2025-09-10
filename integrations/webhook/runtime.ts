import z from "zod";
import { CommonTriggerOptions } from "../../common.ts";
import { registerEventListener } from "../../runtimeSupport.ts";

export interface WebhookTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional HTTP method filter.
   *
   * When specified, only webhook requests with this HTTP method will trigger the handler.
   * Common values include "GET", "POST", "PUT", "PATCH", "DELETE".
   */
  method?: string;
}

export type WebhookTriggerBackendConfig = WebhookTriggerOptions;

export const WebhookTriggerBackendConfig: z.ZodType<WebhookTriggerBackendConfig> = CommonTriggerOptions.extend({
  method: z.string().optional(),
});

/**
 * Represents an incoming webhook HTTP request event.
 *
 * Contains all the information about the HTTP request including
 * method, headers, URL parameters, and body content.
 */
export interface WebhookEvent {
  /** The HTTP method of the request (GET, POST, PUT, etc.) */
  method: string;
  /** URL parameters extracted from the request path */
  urlParams: Record<string, string>;
  /** HTTP headers from the request as key-value pairs */
  headers: Record<string, string>;
  /** The raw body content as text, if present */
  bodyText?: string;
}

/**
 * Webhook event source for handling HTTP webhook requests.
 *
 * Creates HTTP endpoints that can receive requests from external services. This
 * is useful for integrating with services that Glue doesn't currently have
 * direct integrations for.
 *
 * @example
 * ```typescript
 * // Handle any webhook request
 * glue.webhook.onWebhook((event) => {
 *   console.log(`${event.method} webhook received`);
 * });
 *
 * // Handle only POST requests
 * glue.webhook.onPost((event) => {
 *   const payload = JSON.parse(event.bodyText!);
 *   console.log(payload);
 * });
 * ```
 */
export class Webhook {
  /**
   * Registers a glue handler for incoming webhook requests.
   *
   * This is the most flexible method, allowing you to handle webhook requests
   * of any HTTP method. You can optionally filter to specific methods using the
   * options parameter.
   *
   * @example
   * ```typescript
   * // Handle all webhook requests
   * glue.webhook.onWebhook((event) => {
   *   console.log(`Received ${event.method} request`);
   * });
   *
   * // Filter to only PATCH requests
   * glue.webhook.onWebhook((event) => {
   *   updateResource(event.urlParams.id, JSON.parse(event.bodyText!));
   * }, { method: "PATCH" });
   * ```
   */
  onWebhook(
    fn: (event: WebhookEvent) => void,
    options?: WebhookTriggerOptions,
  ): void {
    registerEventListener("webhook", fn, options);
  }

  /**
   * Registers a glue handler specifically for GET webhook requests.
   *
   * @example
   * ```typescript
   * glue.webhook.onGet((event) => {
   *   console.log("received GET request:", event);
   * });
   * ```
   */
  onGet(
    fn: (event: WebhookEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    const config: WebhookTriggerOptions = {
      ...options,
      method: "GET",
    };
    registerEventListener("webhook", fn, config);
  }

  /**
   * Registers a glue handler specifically for POST webhook requests.
   *
   * @example
   * ```typescript
   * glue.webhook.onPost((event) => {
   *   const payload = JSON.parse(event.bodyText!);
   *   console.log(payload);
   * });
   * ```
   */
  onPost(
    fn: (event: WebhookEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    const config: WebhookTriggerOptions = {
      ...options,
      method: "POST",
    };
    registerEventListener("webhook", fn, config);
  }
}
