import z from "zod";
import {
  type CommonCredentialFetcherOptions,
  CommonTriggerBackendConfig,
  type CommonTriggerOptions,
} from "../../common.ts";
import {
  type AccessTokenCredential,
  type CredentialFetcher,
  registerCredentialFetcher,
  registerEventListener,
} from "../../runtimeSupport.ts";
import type {
  CommentCreatedWebhookPayload,
  CommentDeletedWebhookPayload,
  CommentUpdatedWebhookPayload,
  DatabaseContentUpdatedWebhookPayload,
  DatabaseCreatedWebhookPayload,
  DatabaseDeletedWebhookPayload,
  DatabaseMovedWebhookPayload,
  DatabaseSchemaUpdatedWebhookPayload,
  DatabaseUndeletedWebhookPayload,
  DataSourceContentUpdatedWebhookPayload,
  DataSourceCreatedWebhookPayload,
  DataSourceDeletedWebhookPayload,
  DataSourceMovedWebhookPayload,
  DataSourceSchemaUpdatedWebhookPayload,
  DataSourceUndeletedWebhookPayload,
  FileUploadCompletedWebhookPayload,
  FileUploadCreatedWebhookPayload,
  FileUploadExpiredWebhookPayload,
  FileUploadUploadFailedWebhookPayload,
  PageContentUpdatedWebhookPayload,
  PageCreatedWebhookPayload,
  PageDeletedWebhookPayload,
  PageLockedWebhookPayload,
  PageMovedWebhookPayload,
  PagePropertiesUpdatedWebhookPayload,
  PageTranscriptionBlockTranscriptDeletedWebhookPayload,
  PageUndeletedWebhookPayload,
  PageUnlockedWebhookPayload,
  ViewCreatedWebhookPayload,
  ViewDeletedWebhookPayload,
  ViewUpdatedWebhookPayload,
} from "@notionhq/client";

export type NotionWebhookPayload =
  | CommentCreatedWebhookPayload
  | CommentDeletedWebhookPayload
  | CommentUpdatedWebhookPayload
  | DataSourceContentUpdatedWebhookPayload
  | DataSourceCreatedWebhookPayload
  | DataSourceDeletedWebhookPayload
  | DataSourceMovedWebhookPayload
  | DataSourceSchemaUpdatedWebhookPayload
  | DataSourceUndeletedWebhookPayload
  | DatabaseContentUpdatedWebhookPayload
  | DatabaseCreatedWebhookPayload
  | DatabaseDeletedWebhookPayload
  | DatabaseMovedWebhookPayload
  | DatabaseSchemaUpdatedWebhookPayload
  | DatabaseUndeletedWebhookPayload
  | FileUploadCompletedWebhookPayload
  | FileUploadCreatedWebhookPayload
  | FileUploadExpiredWebhookPayload
  | FileUploadUploadFailedWebhookPayload
  | PageContentUpdatedWebhookPayload
  | PageCreatedWebhookPayload
  | PageDeletedWebhookPayload
  | PageLockedWebhookPayload
  | PageMovedWebhookPayload
  | PagePropertiesUpdatedWebhookPayload
  | PageTranscriptionBlockTranscriptDeletedWebhookPayload
  | PageUndeletedWebhookPayload
  | PageUnlockedWebhookPayload
  | ViewCreatedWebhookPayload
  | ViewDeletedWebhookPayload
  | ViewUpdatedWebhookPayload;

export type NotionWebhookPayloadByType = {
  [Payload in NotionWebhookPayload as Payload["type"]]: Payload;
};
export type NotionEventType = keyof NotionWebhookPayloadByType;
type NotionEventHandler<T extends NotionEventType> = (
  event: NotionWebhookPayloadByType[T],
) => void;

export interface NotionTriggerOptions extends CommonTriggerOptions {
  /** Optional Notion workspace ID to select a connected workspace. */
  workspaceId?: string;
}

export interface NotionTriggerBackendConfig extends CommonTriggerBackendConfig {
  events: NotionEventType[];
  workspaceId?: string;
}
export const NotionTriggerBackendConfig: z.ZodType<NotionTriggerBackendConfig> =
  CommonTriggerBackendConfig.extend({
    events: z.array(z.custom<NotionEventType>((type) => typeof type === "string")),
    workspaceId: z.string().optional(),
  });

export interface NotionCredentialFetcherOptions extends CommonCredentialFetcherOptions {
  /** Optional Notion workspace ID to select a connected workspace. */
  workspaceId?: string;
}

/**
 * Notion event source for page, data source, database, comment, file upload,
 * and view webhook events.
 */
export class Notion {
  /**
   * Registers a handler for one or more Notion webhook event types.
   *
   * Notion webhooks are sparse signals. If the handler needs full page,
   * database, block, comment, or file details, use the Notion API with a
   * credential fetcher to retrieve the latest object state.
   */
  onEvents<T extends NotionEventType>(
    events: T[],
    fn: NotionEventHandler<T>,
    options?: NotionTriggerOptions,
  ): void {
    const config: NotionTriggerBackendConfig = {
      events,
      workspaceId: options?.workspaceId,
    };
    registerEventListener("notion", fn, options, config);
  }

  /**
   * Registers a handler for new Notion comments.
   */
  onCommentCreated(
    fn: NotionEventHandler<"comment.created">,
    options?: NotionTriggerOptions,
  ): void {
    this.onEvents(["comment.created"], fn, options);
  }

  /**
   * Registers a handler for database content changes.
   */
  onDatabaseContentUpdated(
    fn: NotionEventHandler<"database.content_updated">,
    options?: NotionTriggerOptions,
  ): void {
    this.onEvents(["database.content_updated"], fn, options);
  }

  /**
   * Registers a handler for new Notion pages.
   */
  onPageCreated(
    fn: NotionEventHandler<"page.created">,
    options?: NotionTriggerOptions,
  ): void {
    this.onEvents(["page.created"], fn, options);
  }

  /**
   * Registers a handler for Notion page content or property edits.
   */
  onPagePropertiesEdited(
    fn: NotionEventHandler<"page.properties_updated">,
    options?: NotionTriggerOptions,
  ): void {
    this.onEvents(["page.properties_updated"], fn, options);
  }

  /**
   * Registers a handler for Notion page content edits.
   */
  onPageContentEdited(
    fn: NotionEventHandler<"page.content_updated">,
    options?: NotionTriggerOptions,
  ): void {
    this.onEvents(["page.content_updated"], fn, options);
  }

  createCredentialFetcher(
    options?: NotionCredentialFetcherOptions,
  ): CredentialFetcher<AccessTokenCredential> {
    return registerCredentialFetcher<AccessTokenCredential>("notion", {
      description: options?.description,
      selector: options?.workspaceId,
    });
  }
}
