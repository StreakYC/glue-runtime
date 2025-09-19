/**
 * Debug integration exposing low-level registration helpers.
 *
 * These APIs are intentionally unstable and primarily meant for internal
 * experimentation and tests. They allow registering arbitrary trigger types
 * and account injections without the usual type-safe wrappers provided by
 * first-class integrations.
 */
import {
  type AccessTokenCredential,
  type AccountFetcher,
  type ApiKeyCredential,
  registerAccountInjection,
  registerEventListener,
} from "../../runtimeSupport.ts";
import type { AccountInjectionBackendConfig } from "../../backendTypes.ts";
import type { CommonTriggerOptions } from "../../common.ts";

export class Debug {
  /**
   * Register a raw trigger with an arbitrary type string and config object.
   *
   * NOTE: This must be called at module top-level before the event loop turns
   * (consistent with all other registrations) otherwise an error will be thrown
   * by the runtime.
   */
  registerRawTrigger(
    type: string,
    fn: (event: unknown) => void,
    // Allow any shape; extra keys are preserved because runtime doesn't validate.
    config?: Record<string, unknown>,
  ): void {
    registerEventListener(type, fn, config as unknown as CommonTriggerOptions | undefined);
  }

  /**
   * Register a raw account injection for an arbitrary integration type.
   *
   * NOTE: This must be called at module top-level before the event loop turns
   * (consistent with all other registrations) otherwise an error will be thrown
   * by the runtime.
   */
  registerRawAccountInjection<T extends AccessTokenCredential | ApiKeyCredential>(
    type: string,
    config: AccountInjectionBackendConfig,
  ): AccountFetcher<T> {
    return registerAccountInjection<T>(type, config);
  }
}
