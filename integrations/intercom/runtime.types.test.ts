import { assert } from "@std/assert";
import type { Intercom as IntercomTypes } from "intercom-client";
import type { Intercom, IntercomConversationPartTag, IntercomEvent } from "./runtime.ts";

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

  intercom.onEvent(["contact.created", "conversation.admin.closed", "job.completed"], (event) => {
    switch (event.topic) {
      case "contact.created":
        expectType<IntercomTypes.Contact>(event.data.item);
        expectType<"contact">(event.data.item.type);
        break;
      case "conversation.admin.closed":
        expectType<IntercomTypes.Conversation>(event.data.item);
        expectType<"conversation">(event.data.item.type);
        break;
      case "job.completed":
        expectType<IntercomTypes.Jobs>(event.data.item);
        expectType<"job">(event.data.item.type);
        break;
    }
  });

  intercom.onEvent(["conversation_part.replied"], (event) => {
    expectType<"conversation_part">(event.data.item.type);
    expectType<IntercomTypes.ConversationPart>(event.data.item);
  });

  intercom.onEvent(["conversation_part.tag.added"], (event) => {
    expectType<IntercomConversationPartTag>(event.data.item);
    expectType<"conversation_part_tag">(event.data.item.type);
  });

  intercom.onEvent(["conversation_part.tag.added", "conversation_part.replied"], (event) => {
    switch (event.topic) {
      case "conversation_part.tag.added":
        expectType<IntercomConversationPartTag>(event.data.item);
        expectType<"conversation_part_tag">(event.data.item.type);
        break;
      case "conversation_part.replied":
        expectType<IntercomTypes.ConversationPart>(event.data.item);
        expectType<"conversation_part">(event.data.item.type);
        break;
    }
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
  expectType<"ticket">(event.data.item.type);
  expectType<string>(event.id);
  expectType<number>(event.first_sent_at);
}

void verifyTopicBasedTyping;
void verifyCustomTopicsRemainSupported;
void verifyEnvelopeType;

Deno.test("intercom runtime typings compile", () => {
  assert(true);
});
