import { Hono } from "hono";
import { retry } from "@std/async/retry";
import {
  type AccessTokenCredential,
  type ApiKeyCredential,
  type CredentialFetcherBackendConfig,
  type Registrations,
  type SecretInjectionBackendConfig,
  TriggerEvent,
} from "./backendTypes.ts";
export type { AccessTokenCredential, ApiKeyCredential };
import { type Log, patchConsoleGlobal, runInLoggingContext } from "./logging.ts";
import type { CommonTriggerBackendConfig, CommonTriggerOptions } from "./common.ts";
import type { DelayedTask, DelayedTaskScheduleOptions } from "./tasks.ts";
import { type DelayedTaskSchedule, resolveScheduleToDate } from "./tasks/schedule.ts";

patchConsoleGlobal();

interface TriggerEventResponse {
  logs: Log[];
  error: string | undefined;
}

interface RegisteredEvent {
  fn: (event: unknown) => void | Promise<void>;
  config: unknown;
}

interface RegisteredCredentialFetcher {
  config: CredentialFetcherBackendConfig;
}

interface RegisteredSecretFetcher {
  config: SecretInjectionBackendConfig;
}

/** RegisteredEvents stored by type and label */
const eventListenersByType = new Map<string, Map<string, RegisteredEvent>>();
/** RegisteredCredentialFetchers stored by type and label */
const credentialFetchersByType = new Map<
  string,
  Map<string, RegisteredCredentialFetcher>
>();
const secretFetchersByLabel = new Map<string, RegisteredSecretFetcher>();

let nextAutomaticLabel = 0;
let nextAutomaticDelayedTaskLabel = 0;

/**
 * @internal
 * Registers an event listener for a specific event type. This function is used
 * internally by event source implementations.
 * @param eventName The name of the event source in glue-backend.
 * @param callback The user's callback function.
 * @param commonTriggerOptions Common trigger options. This should be passed in
 * from the user as-is. Extra properties will be ignored.
 * @param backendConfig The backend config for this trigger. This generally
 * should be of a type that extends {@link CommonTriggerBackendConfig} specific
 * to the event source. The caller should ensure this object only includes the
 * properties that are expected by glue-backend. Properties that are part of
 * {@link CommonTriggerOptions} do not need to be included here, as they will be
 * taken from the `commonTriggerOptions` parameter automatically.
 */
export function registerEventListener<T>(
  eventName: string,
  callback: (event: T) => void,
  commonTriggerOptions: CommonTriggerOptions | undefined,
  backendConfig: CommonTriggerBackendConfig,
): string {
  scheduleInit();

  let specificEventListeners = eventListenersByType.get(eventName);
  if (!specificEventListeners) {
    specificEventListeners = new Map();
    eventListenersByType.set(eventName, specificEventListeners);
  }

  // Delayed tasks use their own label counter with a `task-` prefix so their
  // labels don't collide with normal trigger labels.
  const resolvedLabel = eventName === DELAYED_TASK_TRIGGER_TYPE
    ? `task-${nextAutomaticDelayedTaskLabel++}`
    : String(nextAutomaticLabel++);
  if (specificEventListeners.has(resolvedLabel)) {
    throw new Error(
      `Event listener with label ${JSON.stringify(resolvedLabel)} already registered`,
    );
  }

  const fullBackendConfig: CommonTriggerBackendConfig = {
    ...backendConfig,
    description: commonTriggerOptions?.description,
  };

  const typedCallback = callback as RegisteredEvent["fn"];

  const effectiveCallback: RegisteredEvent["fn"] = commonTriggerOptions?.retryOnFailure
    ? async (event: unknown) => await retry(() => typedCallback(event))
    : typedCallback;

  specificEventListeners.set(resolvedLabel, {
    fn: effectiveCallback,
    config: fullBackendConfig,
  });

  return resolvedLabel;
}

/**
 * Used to fetch an account credential or client at runtime.
 */
export interface CredentialFetcher<T> {
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
 * Registers a credential fetcher for a specific service type. This function is
 * used internally by event source implementations.
 */
export function registerCredentialFetcher<T extends AccessTokenCredential | ApiKeyCredential>(
  type: string,
  config: CredentialFetcherBackendConfig,
): CredentialFetcher<T> {
  scheduleInit();
  let credentialFetchersOfType = credentialFetchersByType.get(type);
  if (!credentialFetchersOfType) {
    credentialFetchersOfType = new Map();
    credentialFetchersByType.set(type, credentialFetchersOfType);
  }

  const resolvedLabel = String(nextAutomaticLabel++);
  if (credentialFetchersOfType.has(resolvedLabel)) {
    throw new Error(
      `Credential fetcher with label ${
        JSON.stringify(
          resolvedLabel,
        )
      } already registered`,
    );
  }
  credentialFetchersOfType.set(resolvedLabel, {
    config,
  });

  return {
    async get() {
      if (!glueDeploymentId || !glueAuthHeader) {
        throw new Error(
          "Credential fetcher must not be used before any trigger events have been received.",
        );
      }
      const glueDeploymentId_ = glueDeploymentId;
      const glueAuthHeader_ = glueAuthHeader;
      // retry on connection errors
      const res = await retry(async () => {
        const res = await fetch(
          `${Deno.env.get("GLUE_API_SERVER")}/glueInternal/deployments/${
            encodeURIComponent(glueDeploymentId_)
          }/accountInjections/${encodeURIComponent(type)}/${encodeURIComponent(resolvedLabel)}`,
          {
            headers: {
              "Authorization": glueAuthHeader_,
            },
          },
        );
        // retry on 5xx errors from backend, which may be transient
        if (res.status >= 500 && res.status < 600) {
          throw new Error(
            `Failed to fetch credential: ${res.status} ${res.statusText}`,
          );
        }
        return res;
      });
      if (!res.ok) {
        throw new Error(
          `Failed to fetch credential: ${res.status} ${res.statusText}`,
        );
      }
      const body = await res.json() as T;
      return body;
    },
  };
}

/**
 * The reserved trigger type string used for delayed tasks. Delayed tasks reuse
 * the normal trigger machinery; the backend invokes them via the same
 * `/__glue__/triggerEvent` endpoint with this type.
 */
const DELAYED_TASK_TRIGGER_TYPE = "delayedTask";

/**
 * @internal
 * Registers a delayed task. The task is registered as a normal trigger of type
 * {@link DELAYED_TASK_TRIGGER_TYPE} so it is dispatched via the existing
 * `/__glue__/triggerEvent` path.
 */
export function registerDelayedTask<T>(
  callback: (event: T) => void | Promise<void>,
  options?: CommonTriggerOptions,
): DelayedTask<T> {
  const label = registerEventListener<T>(
    DELAYED_TASK_TRIGGER_TYPE,
    callback as (event: T) => void,
    options,
    {},
  );

  return {
    async schedule(
      event: T,
      when: DelayedTaskSchedule,
      options?: DelayedTaskScheduleOptions,
    ): Promise<void> {
      if (!glueDeploymentId || !glueAuthHeader) {
        throw new Error(
          "DelayedTask.schedule must not be used before any trigger events have been received.",
        );
      }
      const glueDeploymentId_ = glueDeploymentId;
      const glueAuthHeader_ = glueAuthHeader;
      const body = {
        data: event,
        at: resolveScheduleToDate(when).getTime(),
        idempotencyKey: options?.idempotencyKey ?? `auto-${crypto.randomUUID()}`,
      };
      const res = await retry(async () => {
        const res = await fetch(
          `${Deno.env.get("GLUE_API_SERVER")}/glueInternal/deployments/${
            encodeURIComponent(glueDeploymentId_)
          }/delayedTasks/${encodeURIComponent(label)}/schedule`,
          {
            method: "POST",
            headers: {
              "Authorization": glueAuthHeader_,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          },
        );
        if (res.status >= 500 && res.status < 600) {
          throw new Error(
            `Failed to schedule delayed task: ${res.status} ${res.statusText}`,
          );
        }
        return res;
      });
      if (!res.ok) {
        throw new Error(
          `Failed to schedule delayed task: ${res.status} ${res.statusText}`,
        );
      }
    },
  };
}

/**
 * Used to fetch a named secret value at runtime.
 */
export interface SecretFetcher {
  /**
   * Fetches the secret value. This must only be called within an event
   * handler.
   *
   * @throws If called outside of an event handler, or if there is an error
   * fetching the secret.
   */
  get(): Promise<string>;
}

/**
 * @internal
 * Registers a secret fetcher. This function is used internally by
 * `glue.secrets.createSecretFetcher`.
 */
export function registerSecretFetcher(
  config: SecretInjectionBackendConfig,
): SecretFetcher {
  scheduleInit();

  const resolvedLabel = String(nextAutomaticLabel++);
  if (secretFetchersByLabel.has(resolvedLabel)) {
    throw new Error(
      `Secret fetcher with label ${JSON.stringify(resolvedLabel)} already registered`,
    );
  }
  secretFetchersByLabel.set(resolvedLabel, { config });

  return {
    async get(): Promise<string> {
      if (!glueDeploymentId || !glueAuthHeader) {
        throw new Error(
          "Secret fetcher must not be used before any trigger events have been received.",
        );
      }
      const glueDeploymentId_ = glueDeploymentId;
      const glueAuthHeader_ = glueAuthHeader;
      const res = await retry(async () => {
        const res = await fetch(
          `${Deno.env.get("GLUE_API_SERVER")}/glueInternal/deployments/${
            encodeURIComponent(glueDeploymentId_)
          }/secretInjections/${encodeURIComponent(resolvedLabel)}`,
          {
            headers: {
              "Authorization": glueAuthHeader_,
            },
          },
        );
        if (res.status >= 500 && res.status < 600) {
          throw new Error(
            `Failed to fetch secret: ${res.status} ${res.statusText}`,
          );
        }
        return res;
      });
      if (!res.ok) {
        throw new Error(
          `Failed to fetch secret: ${res.status} ${res.statusText}`,
        );
      }
      const body = await res.json() as { value: string };
      return body.value;
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
      credentialFetchersByType.entries()
        .flatMap(([type, requests]) =>
          requests.entries().map(([label, { config }]) => ({
            type,
            label,
            config,
          }))
        ),
    ),
    secretInjections: Array.from(
      secretFetchersByLabel.entries().map(([label, { config }]) => ({
        label,
        config,
      })),
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

    const serveOptions: Deno.ServeTcpOptions = GLUE_DEV_PORT
      ? { hostname: "127.0.0.1", port: Number(GLUE_DEV_PORT) }
      : {};
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
