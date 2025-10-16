# glue-runtime

A comprehensive event-driven runtime for building serverless integrations with external services.

## Overview

Glue Runtime provides a unified interface for listening to events from various external services and platforms. It allows developers to easily build reactive
applications that respond to events from GitHub, Gmail, webhooks, cron schedules, Stripe, Intercom, Webflow, and Streak.

## Installation

```bash
# Using Deno
import { glue } from "jsr:@glue/runtime";
```

## Quick Start

```typescript
import { glue } from "@glue/runtime";

// Listen for GitHub pull requests
glue.github.onPullRequestEvent("owner", "repo", (event) => {
  console.log(`New PR: ${event.payload.pull_request.title}`);
});

// Schedule recurring tasks
glue.cron.everyXMinutes(30, () => {
  console.log("Running scheduled task");
});

// Handle webhooks
glue.webhook.onPost((event) => {
  const data = JSON.parse(event.bodyText || "{}");
  console.log("Webhook received:", data);
});
```

```bash
glue dev myGlueFile.ts
```

## Event Sources

### GitHub

Monitor GitHub repositories and organizations for various events like pull requests, issues, pushes, and more.

```typescript
// Listen for specific repository events
glue.github.onRepoEvent("owner", "repo", ["push", "release"], (event) => {
  if (event.event === "push") {
    console.log(`Push to ${event.payload.ref}`);
  }
});

// Monitor pull requests
glue.github.onPullRequestEvent("owner", "repo", (event) => {
  if (event.payload.action === "opened") {
    // Handle new PR
  }
});
```

### Gmail

React to new emails in connected Gmail accounts.

```typescript
glue.gmail.onMessage((event) => {
  console.log(`New email: ${event.subject}`);
}, {
  accountEmailAddress: "support@company.com",
});
```

### Webhooks

Create HTTP endpoints that can receive requests from external services.

```typescript
// Handle any HTTP method
glue.webhook.onWebhook((event) => {
  console.log(`${event.method} request to ${event.urlParams}`);
});

// Specific methods
glue.webhook.onGet((event) => {
  // Handle GET requests
});

glue.webhook.onPost((event) => {
  const payload = JSON.parse(event.bodyText || "{}");
  // Process POST data
});
```

### Cron

Schedule your glue to run on a set schedule

```typescript
// Using cron expressions
glue.cron.onCron("0 0 * * *", () => {
  console.log("Running at midnight");
});

// Convenient helpers
glue.cron.everyXMinutes(15, () => {
  console.log("Every 15 minutes");
});

glue.cron.everyXHours(6, () => {
  console.log("Every 6 hours");
});
```

### Stripe

Handle payment and subscription lifecycle events.

```typescript
// Customer events
glue.stripe.onCustomerCreated((event) => {
  const customer = event.data.object;
  console.log(`New customer: ${customer.email}`);
});

// Payment events
glue.stripe.onPaymentSucceeded((event) => {
  const payment = event.data.object;
  // Process successful payment
});

// Subscription events
glue.stripe.onSubscriptionCreated((event) => {
  const subscription = event.data.object;
  // Grant access
});
```

### Intercom

Monitor customer conversations and support interactions.

```typescript
glue.intercom.onConversationClosed((event) => {
  const conversation = event.data.item;
  // Track support metrics
});

glue.intercom.onEvent(["contact.created"], (event) => {
  // Sync new contacts
});
```

### Webflow

React to website changes, form submissions, and CMS updates.

```typescript
// Form submissions
glue.webflow.onFormSubmission("site-id", (event) => {
  const formData = event.payload;
  // Process form submission
});

// CMS changes
glue.webflow.onCollectionItemCreated("site-id", (event) => {
  const item = event.payload;
  // Sync to database
});

// E-commerce
glue.webflow.onNewOrder("site-id", (event) => {
  const order = event.payload;
  // Process order
});
```

### Streak

Monitor CRM pipeline activity and deal progression.

```typescript
// New deals
glue.streak.onNewBoxCreated("pipeline-key", (event) => {
  const box = event.payload;
  // Initialize deal workflow
});

// Stage changes
glue.streak.onBoxStageChanged("pipeline-key", (event) => {
  const { box, newStage } = event.payload;
  // React to stage progression
});
```

### Slack

Monitor messages and channel activity

```typescript
glue.slack.onUserVisibleMessage(); //TODO
```

## Common Options

All event sources support common trigger options:

```typescript
interface CommonTriggerOptions {
  label?: string; // Unique identifier for the trigger
}
```

Example:

```typescript
glue.github.onPullRequestEvent("owner", "repo", handlePR, {
  label: "pr-reviewer",
});
```

## Event Types

All event types are fully typed with TypeScript, providing excellent IDE support and type safety:

- `GithubEvent<T>` - GitHub webhook events
- `GmailMessageEvent` - Gmail new message events
- `WebhookEvent` - HTTP webhook requests
- `CronEvent` - Scheduled task triggers
- `StripeEvent<T>` - Stripe webhook events
- `IntercomEvent` - Intercom webhook events
- `SlackEventWebhook` - Slack webhook events
- `WebflowEvent<T>` - Webflow webhook events
- `StreakEvent` - Streak CRM events

## Important Notes

1. **Registration Timing**: All event handlers must be registered at the top level of your application during initialization. You cannot register handlers
   dynamically after the application has started.

2. **Type Safety**: The package provides full TypeScript support with type inference for event payloads based on the event type.

3. **Error Handling**: Errors thrown in event handlers are automatically caught and logged. The runtime continues processing other events even if one handler
   fails.
