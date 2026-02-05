import z from "zod";

/**
 * Common options available for all trigger event listeners.
 */
export interface CommonTriggerOptions {
  /** Description that appears for the trigger when configuring a Glue. */
  description?: string;
}

// ugh I'm sorry about this super explicit type. It needs to be done because
// otherwise deno's missing-explicit-type lint fails, it needs to be a ZodObject
// type instead of ZodType so the `.extend()` method is present, and it's
// combined with ZodType so the `.parse()` result uses the interface with its
// tsdoc comments.
export const CommonTriggerOptions:
  & z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
  }>
  & z.ZodType<CommonTriggerOptions, CommonTriggerOptions> = z.object({
    description: z.string().optional(),
  });

/**
 * Common options available for all credential fetcher configurations.
 */
export interface CommonCredentialFetcherOptions {
  /** Description that appears for the credential fetcher when configuring a Glue. */
  description?: string;
}

// This needs this ugly explicit type because otherwise deno's
// missing-explicit-type lint fails, and it needs to be a ZodObject type instead
// of ZodType so the `.extend()` method is present.
export const CommonCredentialFetcherOptions:
  & z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
  }>
  & z.ZodType<CommonCredentialFetcherOptions, CommonCredentialFetcherOptions> = z.object({
    description: z.string().optional(),
  });

// these are the same for now but may not be in the future

/** Common backend config for all trigger configurations */
export type CommonTriggerBackendConfig = CommonTriggerOptions;
export const CommonTriggerBackendConfig: typeof CommonTriggerOptions = CommonTriggerOptions;
