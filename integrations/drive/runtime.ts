import z from "zod";
import { CommonTriggerOptions } from "../../common.ts";
import { registerEventListener } from "../../runtimeSupport.ts";
import type { drive_v3 } from "@googleapis/drive";

export type DriveChangeEvent = drive_v3.Schema$Change;

export interface DriveFileChangeEvent {
  type: "update" | "trash" | "untrash" | "remove";
}

/**
 * Options for registering a trigger to listen to changes in Google Drive.
 */
export interface DriveChangesTriggerOptions
  extends CommonTriggerOptions, Omit<DriveChangesTriggerBackendConfig, "type"> {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
  accountEmailAddress?: string;
}

/**
 * Options for registering a trigger to listen to changes in a specific Google
 * Drive file.
 */
export interface DriveFileTriggerOptions extends CommonTriggerOptions {
  /**
   * Optional email address to select appropriate account.
   *
   * @example "user@gmail.com"
   */
  accountEmailAddress?: string;
  fileId: string;
}

interface DriveChangesTriggerBackendConfig {
  type: "changes";
  /**
   * The shared drive from which changes will be returned.
   */
  driveId?: string;
  /**
   * Whether both My Drive and shared drive items should be included in results.
   */
  includeItemsFromAllDrives?: boolean;
  /**
   * Whether to include changes indicating that items have been removed from the
   * list of changes, for example by deletion or loss of access.
   */
  includeRemoved?: boolean;
  /**
   * Whether to restrict the results to changes inside the My Drive hierarchy.
   * This omits changes to files such as those in the Application Data folder or
   * shared files which have not been added to My Drive.
   */
  restrictToMyDrive?: boolean;
  /**
   * A comma-separated list of spaces to query within the corpora. Supported
   * values are 'drive' and 'appDataFolder'.
   */
  spaces?: string;
}

const DriveChangesTriggerBackendConfig: z.ZodType<DriveChangesTriggerBackendConfig> = z.object({
  type: z.literal("changes"),
  driveId: z.string().optional(),
  includeItemsFromAllDrives: z.boolean().optional(),
  includeRemoved: z.boolean().optional(),
  restrictToMyDrive: z.boolean().optional(),
  spaces: z.string().optional(),
});

interface DriveFileTriggerBackendConfig {
  type: "file";
  fileId: string;
}

const DriveFileTriggerBackendConfig: z.ZodType<DriveFileTriggerBackendConfig> = z.object({
  type: z.literal("file"),
  fileId: z.string(),
});

export interface DriveTriggerBackendConfig extends CommonTriggerOptions {
  accountEmailAddress?: string;
  watchConfig: DriveChangesTriggerBackendConfig | DriveFileTriggerBackendConfig;
}

export const DriveTriggerBackendConfig: z.ZodType<DriveTriggerBackendConfig> = CommonTriggerOptions
  .extend({
    accountEmailAddress: z.string().optional(),
    watchConfig: z.union([
      DriveChangesTriggerBackendConfig,
      DriveFileTriggerBackendConfig,
    ]),
  });

/**
 * Event source for listening to changes in Google Drive.
 */
export class Drive {
  /**
   * Registers a glue handler for changes in Google Drive.
   */
  onDriveChanged(
    fn: (event: DriveChangeEvent) => void,
    options?: DriveChangesTriggerOptions,
  ): void {
    const backendConfig: DriveTriggerBackendConfig = {
      description: options?.description,
      accountEmailAddress: options?.accountEmailAddress,
      watchConfig: {
        type: "changes",
        driveId: options?.driveId,
        includeItemsFromAllDrives: options?.includeItemsFromAllDrives,
        includeRemoved: options?.includeRemoved,
        restrictToMyDrive: options?.restrictToMyDrive,
        spaces: options?.spaces,
      },
    };
    registerEventListener("drive", fn, backendConfig);
  }

  /**
   * Registers a glue handler for changes in a specific Google Drive file.
   */
  onFileChanged(
    fn: (event: DriveFileChangeEvent) => void,
    options: DriveFileTriggerOptions,
  ): void {
    const backendConfig: DriveTriggerBackendConfig = {
      description: options.description,
      accountEmailAddress: options.accountEmailAddress,
      watchConfig: {
        type: "file",
        fileId: options.fileId,
      },
    };
    registerEventListener("drive", fn, backendConfig);
  }
}
