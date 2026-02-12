import { assert } from "@std/assert";
import type { Github, GithubEvent } from "./runtime.ts";
import type { IssueCommentEvent, PullRequestEvent } from "@octokit/webhooks-types";

function expectType<T>(_value: T): void {}

function verifyEventBasedTyping(github: Github): void {
  github.onRepoEvent("StreakYC", "myRepo", ["issue_comment", "pull_request"], (event) => {
    expectType<GithubEvent<"issue_comment" | "pull_request">>(event);
    expectType<"issue_comment" | "pull_request">(event.event);
    expectType<IssueCommentEvent | PullRequestEvent>(event.payload);
    switch (event.event) {
      case "issue_comment":
        expectType<IssueCommentEvent>(event.payload);
        break;
      case "pull_request":
        expectType<PullRequestEvent>(event.payload);
        break;
    }
  });
}

void verifyEventBasedTyping;

Deno.test("typings compile", () => {
  assert(true);
});
