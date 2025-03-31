import { Hono } from "hono";
import { type RegisteredTrigger, TriggerEvent } from "./common.ts";
import {
  type Log,
  patchConsoleGlobal,
  runInLoggingContext,
} from "./logging.ts";

patchConsoleGlobal();

interface TriggerEventResponse {
  logs: Log[];
}

interface RegisteredEvent {
  fn: (event: unknown) => void | Promise<void>;
  config: unknown;
}

const eventListenersByType = new Map<string, Map<string, RegisteredEvent>>();

// if you add anything to this interface, you need to update the register event function
export interface CommonTriggerOptions {
  label?: string;
}

let nextAutomaticLabel = 0;

export function registerEvent<T>(
  eventName: string,
  callback: (event: T) => void,
  options: CommonTriggerOptions = {},
) {
  scheduleInit();

  let specificEventListeners = eventListenersByType.get(eventName);
  if (!specificEventListeners) {
    specificEventListeners = new Map();
    eventListenersByType.set(eventName, specificEventListeners);
  }
  const { label, ...config } = options;
  const resolvedLabel = label ?? String(nextAutomaticLabel++);
  if (specificEventListeners.has(resolvedLabel)) {
    throw new Error(
      `Event listener with label ${JSON.stringify(label)} already registered`,
    );
  }
  specificEventListeners.set(resolvedLabel, {
    fn: callback as RegisteredEvent["fn"],
    config,
  });
}

function getRegisteredTriggers(): RegisteredTrigger[] {
  return Array.from(
    eventListenersByType.entries()
      .flatMap(([type, listeners]) =>
        listeners.entries().map(([label, { config }]) => ({
          type,
          label,
          config,
        }))
      ),
  );
}

async function handleTrigger(event: TriggerEvent) {
  const specificEventListeners = eventListenersByType.get(event.type);
  const eventListener = specificEventListeners?.get(event.label);
  if (!eventListener) {
    throw new Error(`Unknown trigger: ${event.type} ${event.label}`);
  }
  await eventListener.fn(event.data);
}

let hasScheduledInit = false;
let hasInited = false;

/**
 * This function needs to be called when any triggers are registered. It
 * schedules a microtask to initialize listening for the triggers, and throws an
 * error if that initialization has already happened.
 */
function scheduleInit() {
  if (hasInited) {
    throw new Error(
      "Attempted to register a trigger after initialization. All triggers must be registered at the top level.",
    );
  }
  if (hasScheduledInit) {
    return;
  }
  hasScheduledInit = true;

  Promise.resolve().then(() => {
    hasInited = true;

    const GLUE_DEV_PORT = Deno.env.get("GLUE_DEV_PORT");

    const serveOptions: Deno.ServeTcpOptions = GLUE_DEV_PORT
      ? { hostname: "127.0.0.1", port: Number(GLUE_DEV_PORT) }
      : {};
    serveOptions.onListen = () => {};

    const app = new Hono();
    app.get("/__glue__/getRegisteredTriggers", (c) => {
      return c.json(getRegisteredTriggers());
    });
    app.post("/__glue__/triggerEvent", async (c) => {
      const body = TriggerEvent.parse(await c.req.json());
      const { logs } = await runInLoggingContext(() => handleTrigger(body));
      const response: TriggerEventResponse = { logs };
      return c.json(response);
    });

    Deno.serve(serveOptions, app.fetch);
  });
}
