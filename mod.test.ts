import { assertEquals } from "@std/assert";
import { glue } from "./mod.ts";
import type { TriggerEvent } from "./common.ts";

Deno.test({
  name: "works",
  // mod.ts doesn't give a way to shut down the server so we need these flags
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    const freePort = await getFreePort();
    Deno.env.set("GLUE_DEV_PORT", freePort.toString());

    let callCount = 0;
    glue.webhook.onWebhook(() => {
      callCount++;
      console.log("webhook callback");
    });

    await Promise.resolve();

    await t.step("getRegisteredTriggers", async () => {
      const response = await fetch(
        `http://127.0.0.1:${freePort}/__glue__/getRegisteredTriggers`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const body = await response.json();
      assertEquals(body, [{ type: "webhook", label: "0", config: {} }]);
    });

    await t.step("triggerEvent", async () => {
      const response = await fetch(
        `http://127.0.0.1:${freePort}/__glue__/triggerEvent`,
        {
          method: "POST",
          body: JSON.stringify(
            {
              type: "webhook",
              label: "0",
              data: {},
            } satisfies TriggerEvent,
          ),
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const body = await response.json();
      assertEquals(body, {
        logs: [
          {
            text: "webhook callback\n",
            timestamp: body.logs[0]?.timestamp,
            type: "stdout",
          },
        ],
      });
      assertEquals(callCount, 1);
    });
  },
});

async function getFreePort(): Promise<number> {
  const server = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
    handler: () => Response.error(),
  });
  await server.shutdown();
  return server.addr.port;
}
