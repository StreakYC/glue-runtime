import type { Stripe as StripeLib } from "stripe";
import {
  type CommonTriggerOptions,
  registerEventListener,
} from "../../../runtimeSupport.ts";

type StripeEventType = StripeLib.Event.Type;

export type StripeTriggerOptions = CommonTriggerOptions & {
  accountId?: string;
};

export interface StripeConfig {
  events: StripeEventType[];
  stripeAccountId?: string;
}

export interface StripeEvent {
  event: StripeEventType;
  payload: StripeLib.Event;
}

export class Stripe {
  // generic events
  onEvents(
    events: StripeEventType[],
    fn: (event: StripeEvent) => void,
    options?: StripeTriggerOptions,
  ): void {
    const config: StripeConfig = {
      events,
      stripeAccountId: options?.accountId,
    };
    registerEventListener("stripe", fn, config, options);
  }

  onCustomerCreated(
    fn: (event: StripeEvent) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.created"], fn, options);
  }

  onSubscriptionCreated(
    fn: (event: StripeEvent) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.subscription.created"], fn, options);
  }

  onSubscriptionCanceled(
    fn: (event: StripeEvent) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["customer.subscription.deleted"], fn, options);
  }

  onPaymentFailed(
    fn: (event: StripeEvent) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["payment_intent.payment_failed"], fn, options);
  }

  onPaymentSucceeded(
    fn: (event: StripeEvent) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvents(["payment_intent.succeeded"], fn, options);
  }
}
