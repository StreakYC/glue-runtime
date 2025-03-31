import {
  type CommonTriggerOptions,
  registerEvent,
} from "../../../runtimeSupport.ts";

export type CronTriggerOptions = CommonTriggerOptions & CronConfig;

export interface CronConfig {
  crontab: string;
}

// deno-lint-ignore no-empty-interface
export interface CronEvent {
}

export class Cron {
  onCron(
    fn: (event: CronEvent) => void,
    options?: CronTriggerOptions,
  ): void {
    registerEvent("cron", fn, options);
  }
}
