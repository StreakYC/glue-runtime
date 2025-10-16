import z from "zod";

/**
 * Common options available for all trigger event listeners.
 */
export interface CommonTriggerOptions {
  /** Description that appears for the trigger when configuring a Glue. */
  description?: string;
}

// ugh I'm sorry about this super explicit type. It needs to be done because
// otherwise deno's missing-explicit-type lint fails, and it needs to be a
// ZodObject type instead of ZodType so the `.extend()` method is present.
export const CommonTriggerOptions: z.ZodObject<
  {
    description: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  CommonTriggerOptions,
  CommonTriggerOptions
> = z.object({
  description: z.string().optional(),
});

/**
 * Common options available for all account injection configurations.
 */
export interface CommonAccountInjectionOptions {
  /** Description that appears for the account injection when configuring a Glue. */
  description?: string;
}

// This needs this ugly explicit type because otherwise deno's
// missing-explicit-type lint fails, and it needs to be a ZodObject type instead
// of ZodType so the `.extend()` method is present.
export const CommonAccountInjectionOptions: z.ZodObject<
  {
    description: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  CommonAccountInjectionOptions,
  CommonAccountInjectionOptions
> = z.object({
  description: z.string().optional(),
});

// these are the same for now but may not be in the future

/** Common backend config for all trigger configurations */
export type CommonTriggerBackendConfig = CommonTriggerOptions;
export const CommonTriggerBackendConfig: z.ZodType<CommonTriggerBackendConfig> = CommonTriggerOptions;
