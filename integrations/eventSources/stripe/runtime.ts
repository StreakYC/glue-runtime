import {
  type CommonTriggerOptions,
  registerEventListener,
} from "../../../runtimeSupport.ts";

export type StripeTriggerOptions = CommonTriggerOptions & {
  accountId?: string;
};

export interface StripeConfig {
  events: StripeEventType[];
  accountId?: string;
}

export interface StripeEvent<T extends StripeEventType> {
  event: T;
  payload: unknown;
}

export type StripeEventType =
  | "charge.succeeded"
  | "charge.failed"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "customer.created"
  | "customer.updated"
  | "customer.deleted"
  | "invoice.created"
  | "invoice.finalized"
  | "invoice.paid"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.deleted";

export class Stripe {
  onEvent<T extends StripeEventType>(
    events: T[],
    fn: (event: StripeEvent<T>) => void,
    options?: StripeTriggerOptions,
  ): void {
    const config: StripeConfig = {
      events,
      accountId: options?.accountId,
    };
    registerEventListener("stripe", fn, config, options);
  }

  onPaymentSucceeded(
    fn: (event: StripeEvent<"payment_intent.succeeded">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvent(["payment_intent.succeeded"], fn, options);
  }

  onChargeSucceeded(
    fn: (event: StripeEvent<"charge.succeeded">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvent(["charge.succeeded"], fn, options);
  }

  onSubscriptionCreated(
    fn: (event: StripeEvent<"subscription.created">) => void,
    options?: StripeTriggerOptions,
  ): void {
    this.onEvent(["subscription.created"], fn, options);
  }
}
