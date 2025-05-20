import {
  type CommonTriggerOptions,
  registerEventListener,
} from "../../../runtimeSupport.ts";

export type StreakTriggerOptions = CommonTriggerOptions & {
  emailAddress?: string;
};

export interface StreakConfig {
  pipelineKey: string;
  event: BoxEventType;
  emailAddress?: string;
}

export interface StreakEvent {
  event: BoxEventType;
  payload: unknown;
}

export class Streak {
  // generic events
  onBoxEvent(
    event: BoxEventType,
    pipelineKey: string,
    fn: (event: StreakEvent) => void,
    options?: StreakTriggerOptions,
  ): void {
    const config: StreakConfig = {
      pipelineKey,
      event,
      emailAddress: options?.emailAddress,
    };
    registerEventListener("streak", fn, config, options);
  }

  // specific events
  onNewBoxCreated(
    pipelineKey: string,
    fn: (event: StreakEvent) => void,
    options?: StreakTriggerOptions,
  ): void {
    this.onBoxEvent("BOX_CREATE", pipelineKey, fn, options);
  }

  onBoxStageChanged(
    pipelineKey: string,
    fn: (event: StreakEvent) => void,
    options?: StreakTriggerOptions,
  ): void {
    this.onBoxEvent("BOX_CHANGE_STAGE", pipelineKey, fn, options);
  }
}

export type BoxEventType =
  | "BOX_CREATE"
  | "BOX_NEW_EMAIL_ADDRESS"
  | "BOX_EDIT"
  | "BOX_CHANGE_STAGE"
  | "BOX_CHANGE_PIPELINE"
  | "BOX_DELETE"
  | "COMMENT_CREATE"
  | "TASK_CREATE"
  | "TASK_COMPLETE"
  | "TASK_DUE"
  | "BOX_NEW_EMAIL_RECEIVED"
  | "MEETING_CREATE"
  | "MEETING_UPDATE"
  | "THREAD_ADDED_TO_BOX"
  | "THREAD_REMOVED_FROM_BOX";
