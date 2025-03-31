import {
  type CommonTriggerOptions,
  registerEventListener,
} from "../../../runtimeSupport.ts";

export interface CronConfig {
  crontab: string;
}

// deno-lint-ignore no-empty-interface
export interface CronEvent {
}

export class Cron {
  onCron(
    crontab: string,
    fn: (event: CronEvent) => void,
    options?: CommonTriggerOptions,
  ): void {
    const config: CronConfig = {
      crontab,
    };
    registerEventListener("cron", fn, config, options);
  }
}
