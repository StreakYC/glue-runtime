import type { Webflow as WebflowLib } from "npm:webflow-api";
import { type CommonTriggerOptions, registerEventListener } from "../../../runtimeSupport.ts";

/**
 * Union type of all possible Webflow webhook event types.
 *
 * This includes all event types that Webflow can send via webhooks,
 * such as form submissions, site publishes, collection item changes, etc.
 *
 * @see https://developers.webflow.com/reference/webhooks-events
 */
export type WebflowEventType = `${WebflowLib.TriggerType}`;

/**
 * Options specific to Webflow event triggers.
 *
 * Extends the common trigger options with Webflow-specific configuration
 * for filtering events by account.
 */
export type WebflowTriggerOptions = CommonTriggerOptions & {
  /**
   * Optional email address to filter events to a specific Webflow account.
   *
   * When specified, only events from the Webflow account associated with
   * this email will trigger the handler. This is useful when you have
   * multiple Webflow accounts connected.
   *
   * @example "designer@company.com"
   */
  accountEmail?: string;
};

/**
 * Internal configuration for Webflow event listeners.
 */
export interface WebflowConfig {
  /** The Webflow site ID to monitor for events */
  siteId: string;
  /** Array of Webflow event types to listen for */
  events: WebflowEventType[];
  /** Optional account to use. If not provided, a
   * default account will be used. */
  accountEmail?: string;
}

// Type mapping from TriggerType to the actual SDK payload types
interface WebflowEventPayloadMap extends Record<WebflowEventType, unknown> {
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

/**
 * Represents a typed Webflow webhook event.
 *
 * The payload type is automatically inferred based on the trigger type,
 * providing full type safety for all Webflow webhook events.
 *
 * @template T - The specific Webflow trigger type
 */
// Webhook event structure with proper typing
export interface WebflowEvent<T extends WebflowEventType> {
  /** The type of Webflow event that occurred */
  triggerType: T;
  /** The event payload, typed according to the trigger type */
  payload: T extends keyof WebflowEventPayloadMap ? WebflowEventPayloadMap[T] : Record<string, unknown>;
}

/**
 * Webflow event source for website and CMS events.
 *
 * Provides methods to register handlers for Webflow webhook events,
 * including form submissions, site publishes, collection item changes,
 * e-commerce events, and more.
 *
 * @example
 * ```typescript
 * // Handle form submissions
 * glue.webflow.onFormSubmission("site-id", (event) => {
 *   const formData = event.payload;
 *   console.log(`New submission from ${formData.name}`);
 *   // Add to CRM, send email, etc.
 * });
 *
 * // Monitor collection changes
 * glue.webflow.onCollectionItemCreated("site-id", (event) => {
 *   const item = event.payload;
 *   syncToExternalDatabase(item);
 * });
 *
 * // Track e-commerce orders
 * glue.webflow.onNewOrder("site-id", (event) => {
 *   const order = event.payload;
 *   processOrder(order);
 * });
 * ```
 *
 * @see https://developers.webflow.com/reference/webhooks
 */
export class Webflow {
  /**
   * Registers a handler for specific Webflow webhook events.
   *
   * This is the most flexible method, allowing you to listen for any
   * combination of Webflow event types on a specific site.
   *
   * @template T - The Webflow event type(s) to listen for
   * @param siteId - The Webflow site ID to monitor
   * @param events - Array of Webflow event types to listen for
   * @param fn - Handler function called when any of the specified events occur
   * @param options - Optional trigger configuration including account filtering
   *
   * @example
   * ```typescript
   * // Listen for multiple CMS events
   * glue.webflow.onEvents("site-id", [
   *   "collection_item_created",
   *   "collection_item_changed",
   *   "collection_item_deleted"
   * ], (event) => {
   *   switch (event.triggerType) {
   *     case "collection_item_created":
   *       console.log("New item:", event.payload.name);
   *       break;
   *     case "collection_item_changed":
   *       console.log("Updated item:", event.payload.name);
   *       break;
   *     case "collection_item_deleted":
   *       console.log("Deleted item:", event.payload.name);
   *       break;
   *   }
   * });
   *
   * // Monitor all page events
   * glue.webflow.onEvents("site-id", [
   *   "page_created",
   *   "page_metadata_updated",
   *   "page_deleted"
   * ], (event) => {
   *   updateSitemap(event);
   * }, { accountEmail: "webmaster@company.com" });
   * ```
   *
   * @see https://developers.webflow.com/reference/webhooks-events - Full list of event types
   */
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

  /**
   * Registers a handler for form submission events specifically.
   *
   * Triggered when a visitor submits a form on your Webflow site.
   * The payload includes all form field data.
   *
   * @param siteId - The Webflow site ID to monitor
   * @param fn - Handler function called when a form is submitted
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.webflow.onFormSubmission("site-id", async (event) => {
   *   const submission = event.payload;
   *
   *   // Extract form data
   *   const { name, email, message, ...otherFields } = submission.data;
   *
   *   // Add to CRM
   *   await createLead({
   *     name,
   *     email,
   *     source: "website-contact-form",
   *     message,
   *     additionalData: otherFields
   *   });
   *
   *   // Send notification email
   *   await sendEmail({
   *     to: "sales@company.com",
   *     subject: `New form submission from ${name}`,
   *     body: `Email: ${email}\nMessage: ${message}`
   *   });
   *
   *   // Send auto-response
   *   await sendAutoResponse(email, name);
   * });
   * ```
   */
  onFormSubmission(
    siteId: string,
    fn: (event: WebflowEvent<"form_submission">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["form_submission"], fn, options);
  }

  /**
   * Registers a handler for site publish events.
   *
   * Triggered whenever the Webflow site is published, either to
   * staging or production.
   *
   * @param siteId - The Webflow site ID to monitor
   * @param fn - Handler function called when the site is published
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.webflow.onSitePublish("site-id", async (event) => {
   *   const site = event.payload;
   *
   *   // Clear CDN cache
   *   await purgeCDNCache(site.customDomains);
   *
   *   // Update search index
   *   await reindexSite(site.id);
   *
   *   // Notify team
   *   await notifySlack({
   *     channel: "#website-updates",
   *     message: `Site published: ${site.name}`
   *   });
   *
   *   // Trigger deployment checks
   *   await runPostDeploymentTests(site.defaultDomain);
   * });
   * ```
   */
  onSitePublish(
    siteId: string,
    fn: (event: WebflowEvent<"site_publish">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["site_publish"], fn, options);
  }

  /**
   * Registers a handler for new e-commerce order events.
   *
   * Triggered when a new order is placed on your Webflow e-commerce site.
   *
   * @param siteId - The Webflow site ID to monitor
   * @param fn - Handler function called when a new order is placed
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.webflow.onNewOrder("site-id", async (event) => {
   *   const order = event.payload;
   *
   *   // Process payment if needed
   *   if (order.status === "pending-payment") {
   *     await processPayment(order);
   *   }
   *
   *   // Send order confirmation
   *   await sendOrderConfirmation({
   *     email: order.customerInfo.email,
   *     orderNumber: order.orderNumber,
   *     items: order.purchasedItems,
   *     total: order.totals.total
   *   });
   *
   *   // Update inventory
   *   for (const item of order.purchasedItems) {
   *     await updateInventory(item.productId, -item.quantity);
   *   }
   *
   *   // Create fulfillment task
   *   await createFulfillmentTask(order);
   * });
   * ```
   */
  onNewOrder(
    siteId: string,
    fn: (event: WebflowEvent<"ecomm_new_order">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["ecomm_new_order"], fn, options);
  }

  /**
   * Registers a handler for collection item creation events.
   *
   * Triggered when a new item is added to a CMS collection in Webflow.
   *
   * @param siteId - The Webflow site ID to monitor
   * @param fn - Handler function called when a collection item is created
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.webflow.onCollectionItemCreated("site-id", async (event) => {
   *   const item = event.payload;
   *
   *   // Sync to external database
   *   await createDatabaseRecord({
   *     webflowId: item.id,
   *     collectionId: item.collectionId,
   *     data: item.fieldData,
   *     createdAt: item.createdOn
   *   });
   *
   *   // Generate related content
   *   if (item.collectionId === "blog-posts") {
   *     await generateSocialMediaPosts(item);
   *   }
   *
   *   // Update search index
   *   await indexSearchContent(item);
   * });
   * ```
   */
  onCollectionItemCreated(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_created">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_created"], fn, options);
  }

  /**
   * Registers a handler for collection item change events.
   *
   * Triggered when an existing CMS collection item is modified in Webflow.
   *
   * @param siteId - The Webflow site ID to monitor
   * @param fn - Handler function called when a collection item is changed
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.webflow.onCollectionItemChanged("site-id", async (event) => {
   *   const item = event.payload;
   *
   *   // Update external database
   *   await updateDatabaseRecord(item.id, {
   *     data: item.fieldData,
   *     lastModified: item.lastUpdated
   *   });
   *
   *   // Clear related caches
   *   await clearCache([
   *     `collection-${item.collectionId}`,
   *     `item-${item.id}`
   *   ]);
   *
   *   // Trigger content review if needed
   *   if (item.draft) {
   *     await notifyContentReviewers(item);
   *   }
   * });
   * ```
   */
  onCollectionItemChanged(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_changed">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_changed"], fn, options);
  }

  /**
   * Registers a handler for collection item deletion events.
   *
   * Triggered when a CMS collection item is deleted from Webflow.
   *
   * @param siteId - The Webflow site ID to monitor
   * @param fn - Handler function called when a collection item is deleted
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.webflow.onCollectionItemDeleted("site-id", async (event) => {
   *   const item = event.payload;
   *
   *   // Remove from external database
   *   await deleteDatabaseRecord(item.id);
   *
   *   // Clean up related assets
   *   await deleteRelatedAssets(item);
   *
   *   // Update search index
   *   await removeFromSearchIndex(item.id);
   *
   *   // Archive for compliance
   *   await archiveDeletedItem(item);
   * });
   * ```
   */
  onCollectionItemDeleted(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_deleted">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_deleted"], fn, options);
  }

  /**
   * Registers a handler for collection item unpublish events.
   *
   * Triggered when a CMS collection item is unpublished in Webflow,
   * making it no longer visible on the live site.
   *
   * @param siteId - The Webflow site ID to monitor
   * @param fn - Handler function called when a collection item is unpublished
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * glue.webflow.onCollectionItemUnpublished("site-id", async (event) => {
   *   const item = event.payload;
   *
   *   // Update status in database
   *   await updateItemStatus(item.id, "unpublished");
   *
   *   // Remove from public search
   *   await removeFromPublicSearch(item.id);
   *
   *   // Notify content team
   *   await notifyContentTeam({
   *     action: "unpublished",
   *     itemId: item.id,
   *     itemName: item.name
   *   });
   * });
   * ```
   */
  onCollectionItemUnpublished(
    siteId: string,
    fn: (event: WebflowEvent<"collection_item_unpublished">) => void,
    options?: WebflowTriggerOptions,
  ): void {
    this.onEvents(siteId, ["collection_item_unpublished"], fn, options);
  }
}
