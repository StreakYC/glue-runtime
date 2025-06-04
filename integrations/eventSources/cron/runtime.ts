import { type CommonTriggerOptions, registerEventListener } from "../../../runtimeSupport.ts";

export interface CronConfig {
  crontab: string;
}

// deno-lint-ignore no-empty-interface
export interface CronEvent {}

export class Cron {
  onCron(crontab: string, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const config: CronConfig = { crontab };
    registerEventListener("cron", fn, config, options);
  }

  everyXMinutes(minutes: number, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const crontab = `*/${minutes} * * * *`;
    this.onCron(crontab, fn, options);
  }

  everyXHours(hours: number, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const crontab = `0 */${hours} * * *`;
    this.onCron(crontab, fn, options);
  }

  everyXDays(days: number, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const crontab = `0 0 */${days} * *`;
    this.onCron(crontab, fn, options);
  }
}
