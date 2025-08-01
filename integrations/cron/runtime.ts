import { type CommonTriggerOptions, registerEventListener } from "../../runtimeSupport.ts";

/**
 * Internal configuration for cron event listeners.
 * @internal
 */
export interface CronConfig {
  /** The cron expression defining when the event should trigger */
  crontab: string;
}

/**
 * Represents a cron scheduled event handed to your glue handler.
 *
 * This event is triggered based on a cron schedule
 *
 * @example
 * ```typescript
 * function handleScheduledTask(event: CronEvent) {
 *   console.log("Scheduled task triggered at", new Date());
 * }
 * ```
 */
// deno-lint-ignore no-empty-interface
export interface CronEvent {}

/**
 * Cron event source for scheduling recurring executions of your glue.
 *
 * Provides methods to register handlers that are triggered on a schedule
 * using standard cron expressions or convenient helper methods for common
 * intervals.
 *
 * @example
 * ```typescript
 * // Using cron expression (runs at 2:30 AM every day)
 * glue.cron.onCron("30 2 * * *", () => {
 *   runDailyBackup();
 * });
 *
 * // Using convenience methods
 * glue.cron.everyXMinutes(15, () => {
 *   checkSystemHealth();
 * });
 *
 * glue.cron.everyXHours(4, () => {
 *   syncDataWithExternalAPI();
 * });
 * ```
 *
 * ## Cron Expression Format
 *
 * Cron expressions follow the standard format:
 * ```
 * ┌───────────── minute (0 - 59)
 * │ ┌───────────── hour (0 - 23)
 * │ │ ┌───────────── day of the month (1 - 31)
 * │ │ │ ┌───────────── month (1 - 12)
 * │ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
 * │ │ │ │ │
 * * * * * *
 * ```
 *
 * Special characters:
 * - `*` any value
 * - `,` value list separator
 * - `-` range of values
 * - `/` step values
 */
export class Cron {
  /**
   * Registers a glue handler to run on a cron schedule.
   *
   * This is the most flexible method, allowing you to specify any valid
   * cron expression for complex scheduling needs.
   *
   * @param crontab - A standard cron expression string
   * @param fn - Handler function called when the schedule triggers
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Run at midnight every day
   * glue.cron.onCron("0 0 * * *", () => {
   *   console.log("Daily midnight task");
   * });
   *
   * // Run at 9 AM on weekdays (Monday-Friday)
   * glue.cron.onCron("0 9 * * 1-5", () => {
   *   sendDailyReport();
   * });
   *
   * // Run every 30 minutes during business hours
   * glue.cron.onCron("*\/30 9-17 * * 1-5", () => {
   *   checkBusinessMetrics();
   * });
   *
   * // Run on the 1st and 15th of each month at 10 AM
   * glue.cron.onCron("0 10 1,15 * *", () => {
   *   generateBiMonthlyReport();
   * });
   *
   * // Run at 3:30 PM every Sunday
   * glue.cron.onCron("30 15 * * 0", () => {
   *   weeklyCleanup();
   * }, { label: "weekly-cleanup-job" });
   * ```
   *
   * @see https://crontab.guru/ - Interactive cron expression editor
   */
  onCron(crontab: string, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const config: CronConfig = { crontab };
    registerEventListener("cron", fn, config, options);
  }

  /**
   * Registers a handler to run every X minutes.
   *
   * Convenience method for scheduling tasks at regular minute intervals.
   * The task will run at 0, X, 2X, 3X... minutes past each hour.
   *
   * @param minutes - The interval in minutes (must be a divisor of 60)
   * @param fn - Handler function called when the schedule triggers
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Run every 5 minutes
   * glue.cron.everyXMinutes(5, () => {
   *   console.log("5-minute check");
   * });
   *
   * // Run every 15 minutes
   * glue.cron.everyXMinutes(15, () => {
   *   syncRecentChanges();
   * });
   *
   * // Run every 30 minutes with a label
   * glue.cron.everyXMinutes(30, () => {
   *   updateCache();
   * }, { label: "cache-updater" });
   * ```
   *
   * @throws Will create an invalid cron expression if minutes > 60 or doesn't divide evenly into 60
   */
  everyXMinutes(minutes: number, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const crontab = `*/${minutes} * * * *`;
    this.onCron(crontab, fn, options);
  }

  /**
   * Registers a handler to run every X hours.
   *
   * Convenience method for scheduling tasks at regular hour intervals.
   * The task will run at the top of the hour (minute 0).
   *
   * @param hours - The interval in hours (must be a divisor of 24)
   * @param fn - Handler function called when the schedule triggers
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Run every 2 hours
   * glue.cron.everyXHours(2, () => {
   *   console.log("Bi-hourly task");
   * });
   *
   * // Run every 6 hours
   * glue.cron.everyXHours(6, () => {
   *   performMaintenanceCheck();
   * });
   *
   * // Run every 12 hours
   * glue.cron.everyXHours(12, () => {
   *   generateHalfDayReport();
   * }, { label: "12h-report" });
   * ```
   *
   * @throws Will create an invalid cron expression if hours > 24 or doesn't divide evenly into 24
   */
  everyXHours(hours: number, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const crontab = `0 */${hours} * * *`;
    this.onCron(crontab, fn, options);
  }

  /**
   * Registers a handler to run every X days.
   *
   * Convenience method for scheduling tasks at regular day intervals.
   * The task will run at midnight (00:00) on the scheduled days.
   *
   * @param days - The interval in days
   * @param fn - Handler function called when the schedule triggers
   * @param options - Optional trigger configuration
   *
   * @example
   * ```typescript
   * // Run every day at midnight
   * glue.cron.everyXDays(1, () => {
   *   console.log("Daily task");
   * });
   *
   * // Run every 3 days
   * glue.cron.everyXDays(3, () => {
   *   performDeepCleanup();
   * });
   *
   * // Run weekly (every 7 days)
   * glue.cron.everyXDays(7, () => {
   *   generateWeeklyReport();
   * }, { label: "weekly-report" });
   * ```
   *
   * @note Due to varying month lengths, intervals > 28 days may not run consistently
   */
  everyXDays(days: number, fn: (event: CronEvent) => void, options?: CommonTriggerOptions): void {
    const crontab = `0 0 */${days} * *`;
    this.onCron(crontab, fn, options);
  }
}
