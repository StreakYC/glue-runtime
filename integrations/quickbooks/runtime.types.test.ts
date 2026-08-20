import { assert } from "@std/assert";
import type { CredentialFetcher } from "../../runtimeSupport.ts";
import type { QuickBooks, QuickBooksCredential } from "./runtime.ts";

function expectType<T>(_value: T): void {}

function verifyCredentialTyping(quickBooks: QuickBooks): void {
  const credentialFetcher = quickBooks.createCredentialFetcher({
    realmId: "1234567890",
    description: "QuickBooks company",
  });
  expectType<CredentialFetcher<QuickBooksCredential>>(credentialFetcher);

  void credentialFetcher.get().then((credential) => {
    expectType<string>(credential.accessToken);
    expectType<string>(credential.realmId);
    expectType<number>(credential.expiresAt);
  });
}

void verifyCredentialTyping;

Deno.test("quickbooks runtime typings compile", () => {
  assert(true);
});
