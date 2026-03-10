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
// This explicit type is necessary to pass deno's missing-explicit-type lint
// fails, it needs to be a ZodObject type instead of ZodType so the `.extend()`
// method is present, and it's combined with ZodType so the `.parse()` result
// uses the interface with its tsdoc comments.
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
 * Common backend config for all trigger configurations. This type is related to
 * {@link CommonTriggerOptions} but without features that exist purely in the
 * runtime.
 */
export type CommonTriggerBackendConfig = Omit<CommonTriggerOptions, "retryOnFailure">;
export const CommonTriggerBackendConfig:
  & z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
  }>
  & z.ZodType<CommonTriggerBackendConfig, CommonTriggerBackendConfig> = CommonTriggerOptions.omit({
    retryOnFailure: true,
  });

/**
 * Common options available for all credential fetcher configurations.
 */
export interface CommonCredentialFetcherOptions {
  /** Description that appears for the credential fetcher when configuring a Glue. */
  description?: string;
}
export const CommonCredentialFetcherOptions:
  & z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
  }>
  & z.ZodType<CommonCredentialFetcherOptions, CommonCredentialFetcherOptions> = z.object({
    description: z.string().optional(),
  });
