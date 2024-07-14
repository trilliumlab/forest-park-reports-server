import { assertEquals } from "@std/assert";
import server from "../../src/server.ts";
import { testClient } from "hono/testing";
import trailsService, { TrailList } from "../../src/services/trails_service.ts";

const client = testClient(server);

Deno.test("GET /trail/list", async () => {
  const res = await client.trail.list.$get();
  assertEquals(await res.json(), Array.from(trailsService.trails.keys()));
});

Deno.test("GET /trail/all", async () => {
  const res = await client.trail.all.$get();
  const trailList = new TrailList(trailsService.trails.values());
  assertEquals(
    new Uint8Array(await res.arrayBuffer()),
    trailList.encode().bytes(),
  );
});

Deno.test("GET /trail/relations", async () => {
  const res = await client.trail.relations.$get();
  assertEquals(
    await res.json(),
    Array.from(trailsService.relations.values()),
  );
});

Deno.test("GET /trail/:id", async () => {
  for (const [id, trail] of trailsService.trails.entries()) {
    const res = await client.trail[":id"].$get({
      param: { id: id.toString() },
    });
    assertEquals(
      new Uint8Array(await res.arrayBuffer()),
      trail.encode().bytes(),
      `GET /trail/${id}: Encoded trail does not match.`,
    );
  }
});
