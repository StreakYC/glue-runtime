import { assert } from "@std/assert";
import type { Intercom as IntercomTypes } from "intercom-client";
import type { Intercom, IntercomEvent } from "./runtime.ts";

function expectType<T>(_value: T): void {}

function verifyTopicBasedTyping(intercom: Intercom): void {
  intercom.onEvent(["contact.created"], (event) => {
    expectType<"contact.created">(event.topic);
    expectType<IntercomTypes.Contact>(event.data.item);
    expectType<"contact">(event.data.item.type);
    expectType<string>(event.app_id);
    expectType<number>(event.created_at);
    expectType<number>(event.delivery_attempts);
  });

  intercom.onEvent(["contact.created", "conversation.admin.closed"], (event) => {
    switch (event.topic) {
      case "contact.created":
        expectType<IntercomTypes.Contact>(event.data.item);
        break;
      case "conversation.admin.closed":
        expectType<IntercomTypes.Conversation>(event.data.item);
        break;
    }
  });

  intercom.onEvent(["conversation_part.replied"], (event) => {
    expectType<"conversation_part">(event.data.item.type);
    expectType<IntercomTypes.ConversationPart>(event.data.item);
  });
}

function verifyCustomTopicsRemainSupported(intercom: Intercom): void {
  intercom.onEvent(["api.request.completed"], (event) => {
    expectType<"api.request.completed">(event.topic);
    expectType<unknown>(event.data.item);
  });
}

function verifyEnvelopeType(event: IntercomEvent<"ticket.created">): void {
  expectType<"notification_event">(event.type);
  expectType<"ticket.created">(event.topic);
  expectType<string>(event.id);
  expectType<number>(event.first_sent_at);
}

void verifyTopicBasedTyping;
void verifyCustomTopicsRemainSupported;
void verifyEnvelopeType;

Deno.test("intercom runtime typings compile", () => {
  assert(true);
});
