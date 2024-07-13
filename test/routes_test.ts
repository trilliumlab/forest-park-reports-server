import { assertEquals } from "@std/assert";
import Server from "../src/server.ts";
import { testClient } from "hono/testing";

const client = testClient(Server().app);

Deno.test("GET /ping", async () => {
  const res = await client.ping.$get();
  assertEquals(await res.text(), "Pong!");
});
