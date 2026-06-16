import { assertEquals, assertThrows } from "@std/assert";
import { addDelayedTaskTimePeriod, type DelayedTaskTimePeriod } from "./schedule.ts";

const FROM = new Date("2026-06-01T12:00:00Z");

function expectAfter(period: DelayedTaskTimePeriod, ms: number): void {
  assertEquals(addDelayedTaskTimePeriod(period, FROM), new Date(FROM.getTime() + ms));
}

Deno.test("addDelayedTaskTimePeriod handles seconds", () => {
  expectAfter("30 seconds", 30 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles singular second", () => {
  expectAfter("1 second", 1000);
});

Deno.test("addDelayedTaskTimePeriod handles minutes", () => {
  expectAfter("5 minutes", 5 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles hours", () => {
  expectAfter("2 hours", 2 * 60 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles days", () => {
  expectAfter("3 days", 3 * 24 * 60 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles weeks", () => {
  expectAfter("2 weeks", 2 * 7 * 24 * 60 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles months", () => {
  // June 1 -> July 1 is 30 days
  expectAfter("1 month", 30 * 24 * 60 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod adds months calendar-aware", () => {
  // Feb 1 2026 -> Mar 1 2026 is only 28 days, which a naive "add 30 days"
  // implementation would get wrong.
  const from = new Date("2026-02-01T12:00:00Z");
  assertEquals(
    addDelayedTaskTimePeriod("1 month", from),
    new Date(from.getTime() + 28 * 24 * 60 * 60 * 1000),
  );
});

Deno.test("addDelayedTaskTimePeriod handles years (calendar-aware)", () => {
  // 2026 is not a leap year: June 1 2026 -> June 1 2027 is 365 days
  expectAfter("1 year", 365 * 24 * 60 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles fractional amounts", () => {
  expectAfter("0.5 hours", 0.5 * 60 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles fractional amounts with no leading zero", () => {
  expectAfter(".5 hours", 0.5 * 60 * 60 * 1000);
});

Deno.test("addDelayedTaskTimePeriod handles fractional seconds", () => {
  expectAfter("1.5 seconds", 1500);
});

Deno.test("addDelayedTaskTimePeriod throws on fractional months", () => {
  assertThrows(
    () => addDelayedTaskTimePeriod("1.5 months", FROM),
    Error,
    "Invalid delay",
  );
});

Deno.test("addDelayedTaskTimePeriod throws on fractional years", () => {
  assertThrows(
    () => addDelayedTaskTimePeriod("0.5 years", FROM),
    Error,
    "Invalid delay",
  );
});

Deno.test("addDelayedTaskTimePeriod throws on invalid delay string", () => {
  assertThrows(
    () => addDelayedTaskTimePeriod("fast" as unknown as DelayedTaskTimePeriod, FROM),
    Error,
    "Invalid delay",
  );
});

Deno.test("addDelayedTaskTimePeriod throws on empty delay string", () => {
  assertThrows(
    () => addDelayedTaskTimePeriod("" as unknown as DelayedTaskTimePeriod, FROM),
    Error,
    "Invalid delay",
  );
});
