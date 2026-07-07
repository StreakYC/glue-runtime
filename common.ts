import z from "zod";

/**
 * Common options available for all trigger event listeners.
 */
export interface CommonTriggerOptions {
  /** Description that appears for the trigger when configuring a Glue. */
  description?: string;
  /**
   * Whether the trigger should retry on failure.
   * @default false
   */
  retryOnFailure?: boolean;
}
// This explicit type is necessary to pass deno's missing-explicit-type lint. It
// needs to be a ZodObject type instead of ZodType so the `.extend()` method is
// present, and it's combined with ZodType so the `.parse()` result uses the
// interface with its tsdoc comments.
export const CommonTriggerOptions:
  & z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    retryOnFailure: z.ZodOptional<z.ZodBoolean>;
  }>
  & z.ZodType<CommonTriggerOptions, CommonTriggerOptions> = z.object({
    description: z.string().optional(),
    retryOnFailure: z.boolean().optional(),
  });

/**
 * Common options available for all trigger event listeners that use an external
 * account.
 */
export interface CommonTriggerWithAccountOptions extends CommonTriggerOptions {
  /**
   * Key-value pairs identifying which account to use, e.g. `{emailAddress:
   * "foo@example.com"}` or `{workspaceId: "xyz"}`. If multiple accounts match
   * all the given selectors, the user will be prompted to pick one during
   * deployment. The available labels for existing accounts can be seen with
   * `glue accounts list`.
   */
  accountSelector?: Record<string, string>;
}
// This explicit type is necessary to pass deno's missing-explicit-type lint. It
// needs to be a ZodObject type instead of ZodType so the `.extend()` method is
// present, and it's combined with ZodType so the `.parse()` result uses the
// interface with its tsdoc comments.
export const CommonTriggerWithAccountOptions:
  & z.ZodObject<
    z.util.Extend<(typeof CommonTriggerOptions)["shape"], {
      accountSelector: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }>
  >
  & z.ZodType<CommonTriggerWithAccountOptions, CommonTriggerWithAccountOptions> =
    CommonTriggerOptions
      .extend({
        accountSelector: z.record(z.string(), z.string()).optional(),
      });

/**
 * Common backend config for all trigger configurations. This type is related to
 * {@link CommonTriggerOptions} but without features that exist purely in the
 * runtime.
 */
export type CommonTriggerBackendConfig = Omit<CommonTriggerOptions, "retryOnFailure">;
export const CommonTriggerBackendConfig:
  & z.ZodObject<z.util.Omit<(typeof CommonTriggerOptions)["shape"], "retryOnFailure">>
  & z.ZodType<CommonTriggerBackendConfig, CommonTriggerBackendConfig> = CommonTriggerOptions.omit({
    retryOnFailure: true,
  });

/**
 * Common backend config for all trigger configurations that use an external
 * account. This type is related to {@link CommonTriggerWithAccountOptions} but
 * without features that exist purely in the runtime.
 */
export type CommonTriggerWithAccountBackendConfig = Omit<
  CommonTriggerWithAccountOptions,
  "retryOnFailure"
>;
export const CommonTriggerWithAccountBackendConfig:
  & z.ZodObject<z.util.Omit<(typeof CommonTriggerWithAccountOptions)["shape"], "retryOnFailure">>
  & z.ZodType<CommonTriggerBackendConfig, CommonTriggerBackendConfig> =
    CommonTriggerWithAccountOptions.omit({
      retryOnFailure: true,
    });

/**
 * Common options available for all credential fetcher configurations.
 */
export interface CommonCredentialFetcherOptions {
  /** Description that appears for the credential fetcher when configuring a Glue. */
  description?: string;
  /**
   * Key-value pairs identifying which account to use, e.g. `{emailAddress:
   * "foo@example.com"}` or `{workspaceId: "xyz"}`. If multiple accounts match
   * all the given selectors, the user will be prompted to pick one during
   * deployment. The available labels for existing accounts can be seen with
   * `glue accounts list`.
   */
  accountSelector?: Record<string, string>;
}
export const CommonCredentialFetcherOptions:
  & z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    accountSelector: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  }>
  & z.ZodType<CommonCredentialFetcherOptions, CommonCredentialFetcherOptions> = z.object({
    description: z.string().optional(),
    accountSelector: z.record(z.string(), z.string()).optional(),
  });
