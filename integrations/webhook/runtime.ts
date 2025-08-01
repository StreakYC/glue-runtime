import { type CommonTriggerOptions, registerEventListener } from "../../runtimeSupport.ts";

/**
 * Options specific to webhook event triggers.
 *
 * Extends the common trigger options with webhook-specific configuration
 * for filtering by HTTP method.
 */
export type WebhookTriggerOptions = CommonTriggerOptions & {
  /**
   * Optional HTTP method filter.
   *
   * When specified, only webhook requests with this HTTP method will trigger the handler.
   * Common values include "GET", "POST", "PUT", "PATCH", "DELETE".
   *
   * @example "POST"
   * @example "GET"
   */
  method?: string;
};

/**
 * Internal configuration for webhook event listeners.
 * @internal
 */
export interface WebhookConfig {
  /** Optional HTTP method filter */
  method?: string;
}

/**
 * Represents an incoming webhook HTTP request event.
 *
 * Contains all the information about the HTTP request including
 * method, headers, URL parameters, and body content.
 *
 * @example
 * ```typescript
 * function handleWebhook(event: WebhookEvent) {
 *   console.log(`${event.method} request received`);
 *   console.log("Headers:", event.headers);
 *   console.log("Body:", event.bodyText);
 * }
 * ```
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
 * Creates HTTP endpoints that can receive requests from external services.
 * This is useful for integrating with services that Glue doesn't yet support
 * native triggers for
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
 *   const payload = JSON.parse(event.bodyText || "{}");
 *   processWebhookPayload(payload);
 * });
 *
 * // Handle Stripe webhooks
 * glue.webhook.onPost((event) => {
 *   if (event.headers["stripe-signature"]) {
 *     verifyAndProcessStripeWebhook(event);
 *   }
 * }, { label: "stripe-webhook" });
 * ```
 */
export class Webhook {
  /**
   * Registers a glue handler for incoming webhook requests.
   *
   * This is the most flexible method, allowing you to handle webhook requests
   * of any HTTP method. You can optionally filter to specific methods using
   * the options parameter.
   *
   * @param fn - Handler function called when a webhook request is received
   * @param options - Optional trigger configuration including method filtering
   *
   * @example
   * ```typescript
   * // Handle all webhook requests
   * glue.webhook.onWebhook((event) => {
   *   console.log(`Received ${event.method} request`);
   *
   *   // Parse JSON body for POST/PUT requests
   *   if (["POST", "PUT"].includes(event.method) && event.bodyText) {
   *     const data = JSON.parse(event.bodyText);
   *     processData(data);
   *   }
   * });
   *
   * // Filter to only PATCH requests
   * glue.webhook.onWebhook((event) => {
   *   updateResource(event.urlParams.id, JSON.parse(event.bodyText || "{}"));
   * }, { method: "PATCH" });
   *
   * // GitHub webhook handler
   * glue.webhook.onWebhook((event) => {
   *   const signature = event.headers["x-hub-signature-256"];
   *   if (verifyGitHubSignature(event.bodyText, signature)) {
   *     const payload = JSON.parse(event.bodyText!);
   *     handleGitHubEvent(payload);
   *   }
   * }, { method: "POST", label: "github-webhook" });
   * ```
   */
  onWebhook(
    fn: (event: WebhookEvent) => void,
    options?: WebhookTriggerOptions,
  ): void {
    const config: WebhookConfig = {
      method: options?.method,
    };
    registerEventListener("webhook", fn, config, options);
  }

  /**
   * Registers a glue handler specifically for GET webhook requests.
   *
   * This is a convenience method for handling GET requests, commonly used
   * for health checks, status endpoints, or simple data retrieval.
   *
   * @param fn - Handler function called when a GET request is received
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Health check endpoint
   * glue.webhook.onGet((event) => {
   *   console.log("Health check requested");
   *   // Return 200 OK
   * });
   *
   * // Query parameter handling
   * glue.webhook.onGet((event) => {
   *   const userId = event.urlParams.userId;
   *   if (userId) {
   *     const userData = fetchUserData(userId);
   *     // Return user data
   *   }
   * });
   *
   * // Webhook verification (e.g., for some services that verify endpoints)
   * glue.webhook.onGet((event) => {
   *   const challenge = event.urlParams["hub.challenge"];
   *   if (challenge) {
   *     // Echo back the challenge for verification
   *     return challenge;
   *   }
   * }, { label: "webhook-verify" });
   * ```
   */
  onGet(
    fn: (event: WebhookEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    const config: WebhookConfig = {
      method: "GET",
    };
    registerEventListener("webhook", fn, config, options);
  }

  /**
   * Registers a glue handler specifically for POST webhook requests.
   *
   * This is a convenience method for handling POST requests, the most common
   * method for webhooks. Used for receiving data, processing form submissions,
   * and handling webhook payloads from external services.
   *
   * @param fn - Handler function called when a POST request is received
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Basic POST handler
   * glue.webhook.onPost((event) => {
   *   const data = JSON.parse(event.bodyText || "{}");
   *   console.log("Received data:", data);
   * });
   *
   * // Slack webhook handler
   * glue.webhook.onPost((event) => {
   *   const payload = JSON.parse(event.bodyText || "{}");
   *   if (payload.type === "url_verification") {
   *     // Respond with challenge for Slack verification
   *     return { challenge: payload.challenge };
   *   }
   *   // Handle Slack events
   *   handleSlackEvent(payload);
   * }, { label: "slack-events" });
   *
   * // Form submission handler
   * glue.webhook.onPost((event) => {
   *   const formData = parseFormData(event.bodyText);
   *   createContactRecord({
   *     name: formData.name,
   *     email: formData.email,
   *     message: formData.message
   *   });
   * }, { label: "contact-form" });
   * ```
   */
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
