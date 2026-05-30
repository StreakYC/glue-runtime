import type { CommonTriggerOptions } from "./common.ts";
import { type DelayedTask, registerDelayedTask } from "./runtimeSupport.ts";

export type {
  DelayedTask,
  DelayedTaskSchedule,
  DelayedTaskTimePeriod,
  DelayedTaskTimePeriodUnit,
} from "./runtimeSupport.ts";

/**
 * Utilities for scheduling work to run later.
 *
 * @example
 * ```typescript
 * const reminderTask = glue.tasks.createDelayedTask(
 *   async (event: { userId: string }) => {
 *     console.log(`Sending reminder to ${event.userId}`);
 *     // ...
 *   },
 * );
 *
 * glue.webhook.onPost(async (event) => {
 *   const { userId } = JSON.parse(event.bodyText!);
 *   await reminderTask.schedule({ userId }, { delay: "15 minutes" });
 * });
 * ```
 */
export class Tasks {
  /**
   * Registers a task that can be scheduled to run later from within any event
   * handler. This method must be called at the top level of your code. The task
   * can only be scheduled to run from within an event handler.
   *
   * The type of the parameter passed to the task through the `.schedule()`
   * method must match the type of the task's callback's first parameter.
   *
   * @example
   * ```typescript
   * const reminderTask = glue.tasks.createDelayedTask(
   *   async (event: { userId: string }) => {
   *     console.log(`Sending reminder to ${event.userId}`);
   *     // ...
   *   },
   * );
   *
   * glue.webhook.onPost(async (event) => {
   *   const { userId } = JSON.parse(event.bodyText!);
   *   await reminderTask.schedule({ userId }, { delay: "15 minutes" });
   * });
   * ```
   */
  createDelayedTask<T>(
    fn: (event: T) => void | Promise<void>,
    options?: CommonTriggerOptions,
  ): DelayedTask<T> {
    return registerDelayedTask<T>(fn, options);
  }
}
