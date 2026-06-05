import type { CommonTriggerOptions } from "./common.ts";
import type { DelayedTaskSchedule } from "./tasks/schedule.ts";
import { registerDelayedTask } from "./runtimeSupport.ts";

/**
 * A reference to a delayed task that can be scheduled to run later from within
 * an event handler.
 */
export interface DelayedTask<T> {
  /**
   * Schedules the task to run with the given data. May only be called from
   * within an event handler.
   *
   * Tasks can not be scheduled more than 30 days in the future.
   *
   * @throws If called outside of an event handler or if there is an error
   * scheduling the task.
   */
  schedule(
    data: T,
    when: DelayedTaskSchedule,
    options?: DelayedTaskScheduleOptions,
  ): Promise<void>;
}

export interface DelayedTaskScheduleOptions {
  /**
   * An optional key that ensures idempotency of the scheduled task. If a task
   * is scheduled with the same idempotency key more than once within a short
   * time period, only one of those tasks will actually be scheduled to run.
   * This prevents accidental double-scheduling of tasks due to retries or
   * duplicate events.
   */
  idempotencyKey?: string;
}

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
   * If a new version of a Glue script is deployed while a delayed task is
   * scheduled but has not yet run, then the task will eventually be run with
   * the new version of the Glue script. Tasks are identified by their
   * registration order, so new calls to `createDelayedTask` should only be
   * added after existing calls to `createDelayedTask`.
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
