import z from "zod";
import type { Stripe as StripeLib } from "stripe";
import { registerEventListener } from "../../runtimeSupport.ts";
import { type CommonTriggerBackendConfig, CommonTriggerOptions } from "../../common.ts";

/**
 * Union type of all possible Stripe webhook event types.
 *
 * This includes all event types that Stripe can send via webhooks,
 * such as customer events, payment events, subscription events, etc.
 *
 * @see https://stripe.com/docs/api/events/types
 */
export type StripeEventType = StripeLib.Event.Type;

export interface StripeTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional label to select appropriate account.
   */
  accountLabel?: string;
}

export interface StripeTriggerBackendConfig extends CommonTriggerBackendConfig {
  /** Array of Stripe event types to listen for */
  events: StripeEventType[];
  /** Optional account label for the account */
  accountLabel?: string;
}

export const StripeTriggerBackendConfig = CommonTriggerOptions.extend({
  events: z.array(z.string()),
  accountLabel: z.string().optional(),
}) as z.ZodType<StripeTriggerBackendConfig>; // doing a cast only because we have a looser type for events

/**
 * Represents a typed Stripe webhook event.
 *
 * This type extracts the specific event object from the Stripe SDK
 * based on the event type, providing full type safety for event handling.
 *
 * @template T - The specific Stripe event type
 *
 * @example
 * ```typescript
 * function handleCustomerCreated(event: StripeEvent<"customer.created">) {
 *   const customer = event.data.object; // Typed as Stripe.Customer
 *   console.log(`New customer: ${customer.email}`);
 * }
 * ```
 */
export type StripeEvent<T extends StripeEventType> = Extract<
  StripeLib.Event,
  { type: T }
>;

/**
 * Stripe event source for payment and subscription events.
 *
 * Provides methods to register glue handlers for Stripe webhook events,
 * including customer lifecycle, payment processing, subscription management,
 * and more. All events are strongly typed using the official Stripe SDK types.
 *
 * @example
 * ```typescript
 * // Listen for new customers
 * glue.stripe.onCustomerCreated((event) => {
 *   const customer = event.data.object;
 *   console.log(`New customer: ${customer.email}`);
 *   // Add to CRM, send welcome email, etc.
 * });
 *
 * // Monitor failed payments
 * glue.stripe.onPaymentFailed((event) => {
 *   const paymentIntent = event.data.object;
 *   notifyCustomerOfFailedPayment(paymentIntent.customer);
 * });
 *
 * // Handle subscription lifecycle
 * glue.stripe.onSubscriptionCreated((event) => {
 *   provisionUserAccess(event.data.object);
 * });
 * ```
 */
export class Stripe {
  /**
   * Registers a handler for specific Stripe webhook events.
   *
   * This is the most flexible method, allowing you to listen for any
   * combination of Stripe event types. The event payload will be typed
   * according to the event types you specify.
   *
   * @template T - The Stripe event type(s) to listen for
   * @param events - Array of Stripe event types to listen for
   * @param fn - Handler function called when any of the specified events occur
   * @param options - Optional trigger configuration including account filtering
   *
   * @example
   * ```typescript
   * // Listen for multiple payment events
   * glue.stripe.onEvents([
   *   "payment_intent.succeeded",
   *   "payment_intent.payment_failed"
   * ], (event) => {
   *   if (event.type === "payment_intent.succeeded") {
   *     console.log("Payment successful:", event.data.object.amount);
   *   } else {
   *     console.log("Payment failed:", event.data.object.last_payment_error?.message);
   *   }
   * });
   *
   * // Listen for all customer events
   * glue.stripe.onEvents([
   *   "customer.created",
   *   "customer.updated",
   *   "customer.deleted"
   * ], (event) => {
   *   syncCustomerToDatabase(event);
   * }, { accountLabel: "main-account" });
   * ```
   *
   * @see https://stripe.com/docs/api/events/types - Full list of event types
   */
  onEvents<T extends StripeEventType>(
    events: T[],
    fn: (event: StripeEvent<T>) => void,
    options?: StripeTriggerOptions,
  ): void {
    const config: StripeTriggerBackendConfig = {
      ...options,
      events,
      accountLabel: options?.accountLabel,
    };
    registerEventListener("stripe", fn, config);
  }

  /**
   * Registers a handler for customer creation events.
   *
   * Triggered when a new customer is created in your Stripe account,
   * either through the API, dashboard, or during checkout.
   */
  onCustomerCreated(
    fn: (event: StripeEvent<"customer.created">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.created"], fn, options);
  }

  /**
   * Registers a handler for subscription creation events.
   *
   * Triggered when a new subscription is created for a customer.
   * This typically happens after successful payment during checkout.
   */
  onSubscriptionCreated(
    fn: (event: StripeEvent<"customer.subscription.created">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.subscription.created"], fn, options);
  }

  /**
   * Registers a handler for subscription cancellation events.
   *
   * Triggered when a subscription is canceled or expires. The subscription
   * may still be active until the end of the current period.
   */
  onSubscriptionCanceled(
    fn: (event: StripeEvent<"customer.subscription.deleted">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.subscription.deleted"], fn, options);
  }

  /**
   * Registers a handler for failed payment events.
   *
   * Triggered when a payment attempt fails. This could be due to
   * insufficient funds, declined card, or other payment issues.
   */
  onPaymentFailed(
    fn: (event: StripeEvent<"payment_intent.payment_failed">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["payment_intent.payment_failed"], fn, options);
  }

  /**
   * Registers a handler for successful payment events.
   *
   * Triggered when a payment is successfully processed and funds
   * have been captured.
   */
  onPaymentSucceeded(
    fn: (event: StripeEvent<"payment_intent.succeeded">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["payment_intent.succeeded"], fn, options);
  }
}
