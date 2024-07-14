import { assertEquals } from "@std/assert";
import { app } from "../src/server.ts";
import { testClient } from "hono/testing";

const client = testClient(app);

Deno.test("GET /ping", async () => {
  const res = await client.ping.$get();
  assertEquals(await res.text(), "Pong!");
});
