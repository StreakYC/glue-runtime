import z from "zod";
import { CommonTriggerOptions } from "../../common.ts";
import { registerEventListener } from "../../runtimeSupport.ts";
import type { drive_v3 } from "@googleapis/drive";

export interface SheetsTriggerBackendConfig extends CommonTriggerOptions {
  accountEmailAddress?: string;
  fileId: string;
  type: "newRow" | "newOrUpdatedRow" | "newComment" | "newSheet";
  /**
   * If true, then the first row is considered a header and will be included in
   * events in addition to included rows.
   */
  // includeHeaderRow?: boolean;
}

export const SheetsTriggerBackendConfig: z.ZodType<SheetsTriggerBackendConfig> =
  CommonTriggerOptions
    .extend({
      accountEmailAddress: z.string().optional(),
      fileId: z.string(),
      type: z.enum(["newRow", "newOrUpdatedRow", "newComment", "newSheet"]),
      // includeHeaderRow: z.boolean().optional(),
    });

export interface SheetNewRowEvent {
  sheetId: number;
  sheetTitle: string;
  /** The visible 1-based index of the row in the sheet. */
  rowNumber: number;
  rowValues: unknown[];
}

export interface SheetNewOrUpdatedRowEvent {
  sheetId: number;
  sheetTitle: string;
  type: "newRow" | "updatedRow";
  /** The visible 1-based index of the row in the sheet. */
  rowNumber: number;
  rowValues: unknown[];
}

export type SheetNewCommentEvent = {
  type: "comment";
  comment: drive_v3.Schema$Comment;
} | {
  type: "reply";
  parent: drive_v3.Schema$Comment;
  reply: drive_v3.Schema$Reply;
};

export interface SheetNewWorksheetEvent {
  sheetId: number;
  sheetTitle: string;
}

/**
 * Options for registering a trigger to listen to changes in a Google Sheet.
 */
export interface SheetsTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
  accountEmailAddress?: string;
}

/**
 * Event source for listening to changes in Google Sheets.
 */
export class Sheets {
  /**
   * Registers a glue handler for new rows added to a Google Sheet.
   * @param fileId The ID of the Google Sheets file to watch.
   */
  onNewRow(
    fileId: string,
    fn: (event: SheetNewRowEvent) => void,
    options?: SheetsTriggerOptions,
  ): void {
    const backendConfig: SheetsTriggerBackendConfig = {
      description: options?.description,
      accountEmailAddress: options?.accountEmailAddress,
      fileId,
      type: "newRow",
    };
    registerEventListener("sheets", fn, backendConfig);
  }

  /**
   * Registers a glue handler for new or updated rows in a Google Sheet.
   * @param fileId The ID of the Google Sheets file to watch.
   */
  onNewOrUpdatedRow(
    fileId: string,
    fn: (event: SheetNewOrUpdatedRowEvent) => void,
    options?: SheetsTriggerOptions,
  ): void {
    const backendConfig: SheetsTriggerBackendConfig = {
      description: options?.description,
      accountEmailAddress: options?.accountEmailAddress,
      fileId,
      type: "newOrUpdatedRow",
    };
    registerEventListener("sheets", fn, backendConfig);
  }

  /**
   * Registers a glue handler for new comments added to a Google Sheet.
   * @param fileId The ID of the Google Sheets file to watch.
   */
  onNewComment(
    fileId: string,
    fn: (event: SheetNewCommentEvent) => void,
    options?: SheetsTriggerOptions,
  ): void {
    const backendConfig: SheetsTriggerBackendConfig = {
      description: options?.description,
      accountEmailAddress: options?.accountEmailAddress,
      fileId,
      type: "newComment",
    };
    registerEventListener("sheets", fn, backendConfig);
  }

  /**
   * Registers a glue handler for new worksheets added to a Google Sheet.
   * @param fileId The ID of the Google Sheets file to watch.
   */
  onNewSheet(
    fileId: string,
    fn: (event: SheetNewWorksheetEvent) => void,
    options?: SheetsTriggerOptions,
  ): void {
    const backendConfig: SheetsTriggerBackendConfig = {
      description: options?.description,
      accountEmailAddress: options?.accountEmailAddress,
      fileId,
      type: "newSheet",
    };
    registerEventListener("sheets", fn, backendConfig);
  }
}
