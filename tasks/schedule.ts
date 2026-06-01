export type DelayedTaskTimePeriodUnit =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

export type DelayedTaskTimePeriod = `${number} ${DelayedTaskTimePeriodUnit}${"s" | ""}`;

/**
 * Specifies when a delayed task should run. Exactly one of `delay` or `at` must
 * be provided.
 */
export type DelayedTaskSchedule = {
  /** Time period after which to run the task. */
  delay: DelayedTaskTimePeriod;
} | {
  /** Absolute time at which to run the task. */
  at: Date;
};

/**
 * Resolves a {@link DelayedTaskSchedule} into the absolute time at which the
 * task should run. A `delay` is added to the current time, with calendar-aware
 * handling for `month` and `year` units.
 */
export function resolveScheduleToDate(when: DelayedTaskSchedule): Date {
  if ("at" in when) {
    return when.at;
  }
  const match = /^(\d+(?:\.\d+)?) (second|minute|hour|day|week|month|year)s?$/
    .exec(when.delay);
  if (!match) {
    throw new Error(`Invalid delay: ${JSON.stringify(when.delay)}`);
  }
  const amount = Number(match[1]);
  const unit = match[2] as DelayedTaskTimePeriodUnit;
  const result = new Date();
  switch (unit) {
    case "second":
      result.setTime(result.getTime() + amount * 1000);
      break;
    case "minute":
      result.setTime(result.getTime() + amount * 60 * 1000);
      break;
    case "hour":
      result.setTime(result.getTime() + amount * 60 * 60 * 1000);
      break;
    case "day":
      result.setTime(result.getTime() + amount * 24 * 60 * 60 * 1000);
      break;
    case "week":
      result.setTime(result.getTime() + amount * 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      result.setMonth(result.getMonth() + amount);
      break;
    case "year":
      result.setFullYear(result.getFullYear() + amount);
      break;
    default:
      unit satisfies never;
      throw new Error(`Unsupported time unit: ${unit}`);
  }
  return result;
}
