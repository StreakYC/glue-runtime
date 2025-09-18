import { Hono } from "hono";
import { type AccountInjectionBackendConfig, type Registrations, TriggerEvent } from "./backendTypes.ts";
import { type Log, patchConsoleGlobal, runInLoggingContext } from "./logging.ts";
import type { CommonTriggerOptions } from "./common.ts";

patchConsoleGlobal();

interface TriggerEventResponse {
  logs: Log[];
  error: string | undefined;
}

interface RegisteredEvent {
  fn: (event: unknown) => void | Promise<void>;
  config: unknown;
}

interface RegisteredAccountInjection {
  config: AccountInjectionBackendConfig;
}

const eventListenersByType = new Map<string, Map<string, RegisteredEvent>>();
const accountInjectionsByType = new Map<
  string,
  Map<string, RegisteredAccountInjection>
>();

export interface AccessTokenCredential {
  accessToken: string;
  expiresAt: number;
}

export interface ApiKeyCredential {
  apiKey: string;
}

let nextAutomaticLabel = 0;

/**
 * @internal
 * Registers an event listener for a specific event type.
 * This function is used internally by event source implementations.
 */
export function registerEventListener<T>(
  eventName: string,
  callback: (event: T) => void,
  options: CommonTriggerOptions | undefined,
) {
  scheduleInit();

  let specificEventListeners = eventListenersByType.get(eventName);
  if (!specificEventListeners) {
    specificEventListeners = new Map();
    eventListenersByType.set(eventName, specificEventListeners);
  }

  const resolvedLabel = String(nextAutomaticLabel++);
  if (specificEventListeners.has(resolvedLabel)) {
    throw new Error(
      `Event listener with label ${JSON.stringify(resolvedLabel)} already registered`,
    );
  }
  specificEventListeners.set(resolvedLabel, {
    fn: callback as RegisteredEvent["fn"],
    config: options ?? {},
  });
}

/**
 * Used to fetch an account credential or client at runtime.
 */
export interface AccountFetcher<T> {
  /**
   * Fetches the account credential or client. This must only be called within
   * an event handler.
   *
   * @throws If called outside of an event handler, or if there is an error
   * fetching the credential.
   */
  get(): Promise<T>;
}

/**
 * @internal
 * Registers an account injection for a specific service type.
 * This function is used internally by event source implementations.
 */
export function registerAccountInjection<T extends AccessTokenCredential | ApiKeyCredential>(
  type: string,
  config: AccountInjectionBackendConfig,
): AccountFetcher<T> {
  scheduleInit();
  let typeAccountInjections = accountInjectionsByType.get(type);
  if (!typeAccountInjections) {
    typeAccountInjections = new Map();
    accountInjectionsByType.set(type, typeAccountInjections);
  }

  const resolvedLabel = String(nextAutomaticLabel++);
  if (typeAccountInjections.has(resolvedLabel)) {
    throw new Error(
      `Account injection with label ${
        JSON.stringify(
          resolvedLabel,
        )
      } already registered`,
    );
  }
  typeAccountInjections.set(resolvedLabel, {
    config,
  });

  return {
    async get() {
      if (!glueDeploymentId || !glueAuthHeader) {
        throw new Error(
          "Credential fetcher must not be used before any trigger events have been received.",
        );
      }
      const res = await fetch(
        `${Deno.env.get("GLUE_API_SERVER")}/glueInternal/deployments/${encodeURIComponent(glueDeploymentId)}/accountInjections/${encodeURIComponent(type)}/${
          encodeURIComponent(resolvedLabel)
        }`,
        {
          headers: {
            "Authorization": glueAuthHeader,
          },
        },
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch account injection: ${res.status} ${res.statusText}`,
        );
      }
      const body = await res.json() as T;
      return body;
    },
  };
}

function getRegistrations(): Registrations {
  return {
    triggers: Array.from(
      eventListenersByType.entries()
        .flatMap(([type, listeners]) =>
          listeners.entries().map(([label, { config }]) => ({
            type,
            label,
            config,
          }))
        ),
    ),
    accountInjections: Array.from(
      accountInjectionsByType.entries()
        .flatMap(([type, requests]) =>
          requests.entries().map(([label, { config }]) => ({
            type,
            label,
            config,
          }))
        ),
    ),
  };
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

let glueDeploymentId: string | undefined;
let glueAuthHeader: string | undefined;

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
    // This is hit when there are multiple registrations (triggers and account
    // injections) on startup. We don't need to do anything more after the first
    // time.
    return;
  }
  hasScheduledInit = true;

  Promise.resolve().then(() => {
    hasInited = true;

    const GLUE_DEV_PORT = Deno.env.get("GLUE_DEV_PORT");

    const serveOptions: Deno.ServeTcpOptions = GLUE_DEV_PORT ? { hostname: "127.0.0.1", port: Number(GLUE_DEV_PORT) } : {};
    serveOptions.onListen = () => {};

    const app = new Hono();
    app.get("/__glue__/getRegistrations", (c) => {
      return c.json(getRegistrations());
    });
    app.get("/__glue__/getRegisteredTriggers", (c) => {
      return c.json(getRegistrations().triggers);
    });
    app.post("/__glue__/triggerEvent", async (c) => {
      // TODO need to authenticate the request as coming from glue-backend.

      glueDeploymentId = c.req.header("X-Glue-Deployment-Id");
      glueAuthHeader = c.req.header("X-Glue-API-Auth-Header");

      const body = TriggerEvent.parse(await c.req.json());
      const { logs, error } = await runInLoggingContext(() => handleTrigger(body));
      const response: TriggerEventResponse = { logs, error };
      return c.json(response);
    });

    Deno.serve(serveOptions, app.fetch);

    // Connect the lifeline once we're ready
    if (GLUE_DEV_PORT) {
      const cliWebsocketAddr = Deno.env.get("GLUE_CLI_WS_ADDR");
      if (cliWebsocketAddr) {
        startLifeline(cliWebsocketAddr);
      }
    }
  });
}

/**
 * Open a websocket connection to the CLI runner so we can exit if the runner
 * dies.
 */
function startLifeline(cliWebsocketAddr: string) {
  const ws = new WebSocket(cliWebsocketAddr);
  ws.onclose = (_event) => {
    // runner died so exit
    Deno.exit(5); // arbitrary non-default error exit code
  };
  ws.onerror = (event) => {
    console.error((event as ErrorEvent).error);
    Deno.exit(5);
  };
}
