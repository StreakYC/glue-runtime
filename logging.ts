import { AsyncLocalStorage } from "node:async_hooks";
import { serializeConsoleArgumentsToString } from "./logging/serialization.ts";

export interface Log {
  timestamp: number;
  type: "stdout" | "stderr";
  text: string;
}

interface LogContext {
  logs: Log[] | undefined;
}

const originalConsoleMethods = { ...console };

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

export function patchConsoleGlobal() {
  const regularConsoleMethods: Array<keyof typeof console> = [
    "log",
    "error",
    "warn",
    "info",
    "debug",
    "table",
  ];
  for (const methodName of regularConsoleMethods) {
    const originalMethod = console[methodName];
    console[methodName] = (...args) => {
      const logs = asyncLocalStorage.getStore()?.logs;
      if (logs) {
        const timestamp = Date.now();
        const text = serializeConsoleArgumentsToString(args) + "\n";
        logs.push({
          timestamp,
          type: methodName === "error" ? "stderr" : "stdout",
          text,
        });
      }
      return originalMethod.apply(console, args);
    };
  }

  const timingStarts = new Map<string, number>();
  console.time = (label = "default") => {
    timingStarts.set(label, Date.now());
  };
  console.timeEnd = (label = "default") => {
    const start = timingStarts.get(label);
    if (start === undefined) {
      console.warn(`Timer '${label}' does not exist`);
      return;
    }
    const duration = Date.now() - start;
    timingStarts.delete(label);
    console.log(`${label}: ${duration}ms`);
  };
}

/** Used by tests so tests don't have to patch the console global */
export function manualLog(log: Log) {
  const logs = asyncLocalStorage.getStore()?.logs;
  if (logs) {
    logs.push(log);
  } else {
    throw new Error("manualLog called outside of logging context");
  }
}

export interface Logger {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export async function runInLoggingContext<T>(
  fn: (logger: Logger) => Awaitable<T>,
): Promise<{ logs: Log[]; error: string | undefined }> {
  const logs: Log[] = [];
  const logContext: LogContext = { logs };
  const logger: Logger = {
    log: (...args) => {
      const timestamp = Date.now();
      originalConsoleMethods.log.apply(console, args);
      logContext.logs?.push({
        timestamp,
        type: "stdout",
        text: serializeConsoleArgumentsToString(args) + "\n",
      });
    },
    error: (...args) => {
      const timestamp = Date.now();
      originalConsoleMethods.error.apply(console, args);
      logContext.logs?.push({
        timestamp,
        type: "stderr",
        text: serializeConsoleArgumentsToString(args) + "\n",
      });
    },
  };

  let error: string | undefined;
  try {
    await asyncLocalStorage.run(logContext, () => fn(logger));
  } catch (e) {
    logger.error(e);
    error = serializeConsoleArgumentsToString([e]);
  } finally {
    logContext.logs = undefined;
  }
  return { logs, error };
}

type Awaitable<T> = T | Promise<T>;
