import { assertEquals } from "@std/assert";
import { server } from "../../src/server.ts";
import { testClient } from "hono/testing";
import dbService from "../../src/service/db_service.ts";
import { BadRequestSchema, NotFoundSchema } from "../../src/decorator.ts";

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

// Makes sure /hazard/image/:uuid endpoint works when given a non-existent uuid
Deno.test(
  "GET /hazard/image/{uuid} - non-existent image",
  dbTestOptions,
  async () => {
    const uuid = "00000000-0000-0000-0000-000000000001";
    const res = await client.hazard.image[":uuid"].$get({
      param: { uuid },
    });
    assertEquals(res.status, NotFoundSchema.shape.code.value);
    assertEquals(await res.json(), {
      code: NotFoundSchema.shape.code.value,
      error: NotFoundSchema.shape.error.value,
      message: `Could not find image with uuid '${uuid}'.`,
    });
  },
);

// Makes sure /hazard/image/:uuid endpoint works when given a non-existent uuid
Deno.test(
  "GET /hazard/image/{uuid} - invalid uuid",
  dbTestOptions,
  async () => {
    const uuid = "this is not a uuid";
    const res = await client.hazard.image[":uuid"].$get({
      param: { uuid },
    });
    assertEquals(res.status, BadRequestSchema.shape.code.value);
  },
);
