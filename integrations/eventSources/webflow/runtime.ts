import type { Webflow as WebflowLib } from "npm:webflow-api";
import { type CommonTriggerOptions, registerEventListener } from "../../../runtimeSupport.ts";

export type WebflowEventType = `${WebflowLib.TriggerType}`;

export type WebflowTriggerOptions = CommonTriggerOptions & {
  accountEmail?: string;
};

export interface WebflowConfig {
  siteId: string;
  events: WebflowEventType[];
  accountEmail?: string;
}

// Type mapping from TriggerType to the actual SDK payload types
interface WebflowEventPayloadMap {
  form_submission: WebflowLib.FormSubmission;
  site_publish: WebflowLib.Site;
  page_created: WebflowLib.Page;
  page_metadata_updated: WebflowLib.Page;
  page_deleted: WebflowLib.Page;
  ecomm_new_order: WebflowLib.Order;
  ecomm_order_changed: WebflowLib.Order;
  ecomm_inventory_changed: WebflowLib.Product; // Inventory events relate to products
  user_account_added: WebflowLib.User;
  user_account_updated: WebflowLib.User;
  user_account_deleted: WebflowLib.User;
  collection_item_created: WebflowLib.CollectionItem;
  collection_item_changed: WebflowLib.CollectionItem;
  collection_item_deleted: WebflowLib.CollectionItem;
  collection_item_unpublished: WebflowLib.CollectionItem;
  comment_created: Record<string, unknown>; // Comment type not found in SDK
}

// Webhook event structure with proper typing
export interface WebflowEvent<T extends WebflowEventType> {
  triggerType: T;
  payload: T extends keyof WebflowEventPayloadMap ? WebflowEventPayloadMap[T] : Record<string, unknown>;
}

export class Webflow {
  // Generic events handler
  onEvents<T extends WebflowEventType>(
    siteId: string,
    events: T[],
    fn: (event: WebflowEvent<T>) => void,
    options?: WebflowTriggerOptions,
  ): void {
    const config: WebflowConfig = {
      siteId,
      events,
      accountEmail: options?.accountEmail,
    };
    registerEventListener("webflow", fn, config, options);
  }

  onFormSubmission(
    siteId: string,
    fn: (event: WebflowEvent<"form_submission">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["form_submission"], fn, options);
  }

  onSitePublish(
    siteId: string,
    fn: (event: WebflowEvent<"site_publish">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["site_publish"], fn, options);
  }

  onNewOrder(
    siteId: string,
    fn: (event: WebflowEvent<"ecomm_new_order">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["ecomm_new_order"], fn, options);
  }

  onCollectionItemCreated(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_created">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_created"], fn, options);
  }

  onCollectionItemChanged(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_changed">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_changed"], fn, options);
  }

  onCollectionItemDeleted(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_deleted">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_deleted"], fn, options);
  }

  onCollectionItemUnpublished(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_unpublished">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_unpublished"], fn, options);
  }
}
