import type { Stripe as StripeLib } from "stripe";
import {
  type CommonTriggerOptions,
  registerEventListener,
} from "../../../runtimeSupport.ts";

export type StripeEventType = StripeLib.Event.Type;

export type StripeTriggerOptions = CommonTriggerOptions & {
  accountLabel?: string;
};

export interface StripeConfig {
  events: StripeEventType[];
  accountLabel?: string;
}

export type StripeEvent<T extends StripeEventType> = Extract<
  StripeLib.Event,
  { type: T }
>;

export class Stripe {
  // generic events
  onEvents<T extends StripeEventType>(
    events: T[],
    fn: (event: StripeEvent<T>) => void,
    options?: StripeTriggerOptions,
  ): void {
    const config: StripeConfig = {
      events,
      accountLabel: options?.accountLabel,
    };
    registerEventListener("stripe", fn, config, options);
  }

  onCustomerCreated(
    fn: (event: StripeEvent<"customer.created">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.created"], fn, options);
  }

  onSubscriptionCreated(
    fn: (event: StripeEvent<"customer.subscription.created">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.subscription.created"], fn, options);
  }

  onSubscriptionCanceled(
    fn: (event: StripeEvent<"customer.subscription.deleted">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.subscription.deleted"], fn, options);
  }

  onPaymentFailed(
    fn: (event: StripeEvent<"payment_intent.payment_failed">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["payment_intent.payment_failed"], fn, options);
  }

  onPaymentSucceeded(
    fn: (event: StripeEvent<"payment_intent.succeeded">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["payment_intent.succeeded"], fn, options);
  }
}
