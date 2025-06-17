import { type CommonAccountInjectionOptions, type CommonTriggerOptions, registerAccountInjection, registerEventListener } from "../../../runtimeSupport.ts";

export interface GmailMessageEvent {
  type: "messageAdded";
  subject: string;
}

export interface GmailTriggerOptions extends CommonTriggerOptions {
  accountEmailAddress?: string;
}

export interface GmailConfig {
  accountEmailAddress?: string;
}

export class Gmail {
  onMessage(
    fn: (event: GmailMessageEvent) => void,
    options?: GmailTriggerOptions,
  ): void {
    const config: GmailConfig = {
      accountEmailAddress: options?.accountEmailAddress,
    };
    registerEventListener("gmail", fn, config, options);
  }

  getCredentialFetcher(config?: GmailConfig, options?: CommonAccountInjectionOptions): () => Promise<string> {
    const fetcher = registerAccountInjection("google", config, options);
    return fetcher;
  }

  getClientFetcher(config?: GmailConfig, options?: CommonAccountInjectionOptions): () => Promise<string> {
    const credFetcher = this.getCredentialFetcher(config, options);

    return async () => {
      const _credential = await credFetcher();
      // const client = new GoogleClient(_credential);
      throw new Error("TODO");
    };
  }
}
