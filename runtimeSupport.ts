import { Hono } from "hono";
import { type Registrations, TriggerEvent } from "./internalTypes.ts";
import { type Log, patchConsoleGlobal, runInLoggingContext } from "./logging.ts";

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
  config: unknown;
}

const eventListenersByType = new Map<string, Map<string, RegisteredEvent>>();
const accountInjectionsByType = new Map<
  string,
  Map<string, RegisteredAccountInjection>
>();

/**
 * Common options available for all trigger event listeners.
 *
 * These options can be passed to any event source's registration methods
 * to customize the behavior of the trigger.
 *
 * @example
 * ```typescript
 * glue.github.onPullRequestEvent("owner", "repo", handlePR, {
 *   label: "my-pr-handler"
 * });
 * ```
 */
export interface CommonTriggerOptions {
  /**
   * A unique label to identify this specific trigger registration. Labels
   * are useful so that Glue can correlate different trigger handlers across
   * deployment versions. This keeps things like webhook URLs consistent
   * between deployments.
   *
   * If not provided, an auto-generated numeric label will be assigned.
   * Labels must be unique for a given trigger type.
   *
   * @example "pr-reviewer"
   * @example "daily-backup"
   */
  label?: string;
}

/**
 * Common options available for all account injection configurations.
 *
 * Account injections allow you to configure authentication and connection
 * details for external services that your triggers will use.
 *
 * @example
 * ```typescript
 * glue.github.inject({
 *   label: "my-github-account"
 * });
 * ```
 */
export interface CommonAccountInjectionOptions {
  /**
   * A unique label to identify this specific account injection. Labels are
   * useful so that Glue can correlate different account injections across
   * deployment versions. This keeps things like default accounts consistent
   * between deployments.
   *
   * If not provided, an auto-generated numeric label will be assigned.
   * Labels must be unique within your application. Labels are also used to
   * identify the account injection when it is used in a trigger.
   *
   * @example "primary-github"
   * @example "customer-stripe"
   */
  label?: string;
}

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
 *
 * @param eventName - The type of event to listen for (e.g., "github", "stripe")
 * @param callback - The function to call when the event is triggered
 * @param config - Event source specific configuration
 * @param options - Common trigger options including label
 */
export function registerEventListener<T>(
  eventName: string,
  callback: (event: T) => void,
  config: unknown,
  options: CommonTriggerOptions | undefined,
) {
  scheduleInit();

  let specificEventListeners = eventListenersByType.get(eventName);
  if (!specificEventListeners) {
    specificEventListeners = new Map();
    eventListenersByType.set(eventName, specificEventListeners);
  }

  const resolvedLabel = options?.label ?? String(nextAutomaticLabel++);
  if (specificEventListeners.has(resolvedLabel)) {
    throw new Error(
      `Event listener with label ${JSON.stringify(resolvedLabel)} already registered`,
    );
  }
  specificEventListeners.set(resolvedLabel, {
    fn: callback as RegisteredEvent["fn"],
    config,
  });
}

/**
 * @internal
 * Registers an account injection for a specific service type.
 * This function is used internally by event source implementations.
 *
 * @param type - The type of service account to inject (e.g., "github", "stripe")
 * @param config - Service-specific account configuration
 * @param options - Common account injection options including label
 */
export function registerAccountInjection<T extends AccessTokenCredential | ApiKeyCredential>(
  type: string,
  config: unknown,
  options: CommonAccountInjectionOptions | undefined,
): () => Promise<T> {
  scheduleInit();
  let typeAccountInjections = accountInjectionsByType.get(type);
  if (!typeAccountInjections) {
    typeAccountInjections = new Map();
    accountInjectionsByType.set(type, typeAccountInjections);
  }

  const resolvedLabel = options?.label ?? String(nextAutomaticLabel++);
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

  return async () => {
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
  });
}
