import { assertEquals } from "@std/assert";
import server from "../../src/server.ts";
import { testClient } from "hono/testing";
import dbService from "../../src/services/db_service.ts";

const client = testClient(server);

// This is needed since npm:pg uses setTimeout on closing db connections.
const dbTestOptions = {
  sanitizeOps: false,
  sanitizeResources: false,
};

// Makes sure /hazard/active endpoint returns all active hazards in db.
Deno.test("GET /hazard/active", dbTestOptions, async () => {
  const res = await client.hazard.active.$get();
  const hazards = (await dbService.fetchHazards(true))
    .map(({ time, ...hazard }) => ({
      time: time.toISOString(),
      ...hazard,
    }));
  assertEquals(await res.json(), hazards);
});

// Makes sure /hazard/image/:uuid endpoint works when given an invalid uuid.
Deno.test("GET /hazard/image/:uuid - invalid uuid", dbTestOptions, async () => {
  const uuid = "this-is-not-a-uuid";
  const res = await client.hazard.image[":uuid"].$get({
    param: { uuid },
  });
  assertEquals(res.status, 404);
  assertEquals(await res.json(), {
    code: 404,
    error: "Resource Not Found",
    message: `Could not find image with uuid '${uuid}'.`,
  });
});
