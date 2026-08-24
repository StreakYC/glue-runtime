import { z } from "zod";
import type { CommonCredentialFetcherOptions } from "../../common.ts";
import {
  CommonTriggerWithAccountBackendConfig,
  type CommonTriggerWithAccountOptions,
} from "../../common.ts";
import {
  type AccessTokenCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
  registerEventListener,
} from "../../runtimeSupport.ts";

export type QuickBooksKnownEventType =
  | `qbo.customer.${"created" | "updated" | "deleted" | "merged"}.v1`
  | `qbo.invoice.${"created" | "updated" | "deleted" | "voided" | "emailed"}.v1`
  | `qbo.payment.${"created" | "updated" | "deleted" | "voided" | "emailed"}.v1`
  | `qbo.bill.${"created" | "updated" | "deleted"}.v1`
  | `qbo.vendor.${"created" | "updated" | "deleted" | "merged"}.v1`
  | `qbo.item.${"created" | "updated" | "deleted" | "merged"}.v1`;

/**
 * A QuickBooks CloudEvent type. Known portal event types receive autocomplete,
 * while string literals introduced by Intuit remain usable without a runtime
 * release.
 */
export type QuickBooksEventType =
  | QuickBooksKnownEventType
  | (string & Record<never, never>);

/** The sparse CloudEvent delivered by QuickBooks Online webhooks. */
export interface QuickBooksCloudEvent<TType extends QuickBooksEventType = QuickBooksEventType> {
  specversion: "1.0";
  id: string;
  source?: string;
  type: TType;
  datacontenttype?: string;
  time: string;
  intuitentityid: string;
  intuitaccountid: string;
  data: Record<string, unknown>;
}

export type QuickBooksAccountSelector = {
  realmId?: string;
  companyName?: string;
  userName?: string;
  userEmail?: string;
};

export interface QuickBooksTriggerOptions extends CommonTriggerWithAccountOptions {
  accountSelector?: QuickBooksAccountSelector;
}

export interface QuickBooksTriggerBackendConfig extends CommonTriggerWithAccountBackendConfig {
  events: QuickBooksEventType[];
}

export const QuickBooksTriggerBackendConfig: z.ZodType<QuickBooksTriggerBackendConfig> =
  CommonTriggerWithAccountBackendConfig.extend({
    events: z.array(z.string().min(1)).min(1),
  });

export type QuickBooksEventHandler<TType extends QuickBooksEventType> = (
  event: QuickBooksCloudEvent<TType>,
) => void;

export interface QuickBooksCredential extends AccessTokenCredential {
  expiresAt: number;
  realmId: string;
}

export interface QuickBooksCredentialFetcherOptions extends CommonCredentialFetcherOptions {
  accountSelector?: QuickBooksAccountSelector;
}

export class QuickBooks {
  onEvents<TType extends QuickBooksEventType>(
    events: TType[],
    fn: QuickBooksEventHandler<TType>,
    options?: QuickBooksTriggerOptions,
  ): void {
    const config: QuickBooksTriggerBackendConfig = { events };
    registerEventListener("quickbooks", fn, options, config);
  }

  onCustomerCreated(
    fn: QuickBooksEventHandler<"qbo.customer.created.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.customer.created.v1"], fn, options);
  }

  onCustomerUpdated(
    fn: QuickBooksEventHandler<"qbo.customer.updated.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.customer.updated.v1"], fn, options);
  }

  onCustomerDeleted(
    fn: QuickBooksEventHandler<"qbo.customer.deleted.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.customer.deleted.v1"], fn, options);
  }

  onCustomerMerged(
    fn: QuickBooksEventHandler<"qbo.customer.merged.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.customer.merged.v1"], fn, options);
  }

  onInvoiceCreated(
    fn: QuickBooksEventHandler<"qbo.invoice.created.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.invoice.created.v1"], fn, options);
  }

  onInvoiceUpdated(
    fn: QuickBooksEventHandler<"qbo.invoice.updated.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.invoice.updated.v1"], fn, options);
  }

  onInvoiceDeleted(
    fn: QuickBooksEventHandler<"qbo.invoice.deleted.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.invoice.deleted.v1"], fn, options);
  }

  onInvoiceVoided(
    fn: QuickBooksEventHandler<"qbo.invoice.voided.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.invoice.voided.v1"], fn, options);
  }

  onInvoiceEmailed(
    fn: QuickBooksEventHandler<"qbo.invoice.emailed.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.invoice.emailed.v1"], fn, options);
  }

  onPaymentCreated(
    fn: QuickBooksEventHandler<"qbo.payment.created.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.payment.created.v1"], fn, options);
  }

  onPaymentUpdated(
    fn: QuickBooksEventHandler<"qbo.payment.updated.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.payment.updated.v1"], fn, options);
  }

  onPaymentDeleted(
    fn: QuickBooksEventHandler<"qbo.payment.deleted.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.payment.deleted.v1"], fn, options);
  }

  onPaymentVoided(
    fn: QuickBooksEventHandler<"qbo.payment.voided.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.payment.voided.v1"], fn, options);
  }

  onPaymentEmailed(
    fn: QuickBooksEventHandler<"qbo.payment.emailed.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.payment.emailed.v1"], fn, options);
  }

  onBillCreated(
    fn: QuickBooksEventHandler<"qbo.bill.created.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.bill.created.v1"], fn, options);
  }

  onBillUpdated(
    fn: QuickBooksEventHandler<"qbo.bill.updated.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.bill.updated.v1"], fn, options);
  }

  onBillDeleted(
    fn: QuickBooksEventHandler<"qbo.bill.deleted.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.bill.deleted.v1"], fn, options);
  }

  onVendorCreated(
    fn: QuickBooksEventHandler<"qbo.vendor.created.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.vendor.created.v1"], fn, options);
  }

  onVendorUpdated(
    fn: QuickBooksEventHandler<"qbo.vendor.updated.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.vendor.updated.v1"], fn, options);
  }

  onVendorDeleted(
    fn: QuickBooksEventHandler<"qbo.vendor.deleted.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.vendor.deleted.v1"], fn, options);
  }

  onVendorMerged(
    fn: QuickBooksEventHandler<"qbo.vendor.merged.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.vendor.merged.v1"], fn, options);
  }

  onItemCreated(
    fn: QuickBooksEventHandler<"qbo.item.created.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.item.created.v1"], fn, options);
  }

  onItemUpdated(
    fn: QuickBooksEventHandler<"qbo.item.updated.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.item.updated.v1"], fn, options);
  }

  onItemDeleted(
    fn: QuickBooksEventHandler<"qbo.item.deleted.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.item.deleted.v1"], fn, options);
  }

  onItemMerged(
    fn: QuickBooksEventHandler<"qbo.item.merged.v1">,
    options?: QuickBooksTriggerOptions,
  ): void {
    this.onEvents(["qbo.item.merged.v1"], fn, options);
  }

  /**
   * Creates a credential fetcher for the QuickBooks Online Accounting API.
   * The returned credential includes the selected company ID.
   */
  createCredentialFetcher(
    options?: QuickBooksCredentialFetcherOptions,
  ): CredentialFetcher<QuickBooksCredential> {
    return registerCredentialFetcher<QuickBooksCredential>("quickbooks", options ?? {});
  }
}
