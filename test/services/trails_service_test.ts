import { assertEquals, assertExists } from "@std/assert";
import { TrailList, TrailsService } from "../../src/services/trails_service.ts";
import * as path from "@std/path";

const trailService = new TrailsService(
  path.fromFileUrl(import.meta.resolve("../../test_data/ways_test")),
  path.fromFileUrl(import.meta.resolve("../../test_data/relations_test")),
);
await trailService.init();

// Verifies that trails encode correctly.
Deno.test("Trail.encode()", async () => {
  const testId = 105407026;
  const expected = await Deno.readFile(
    path.fromFileUrl(
      import.meta.resolve(`../../test_data/Trail_${testId}.expected`),
    ),
  );
  const trail = trailService.trails.get(testId);
  assertExists(trail);
  assertEquals(expected, trail.encode().bytes());
});

// Verifies that trail lists encode correctly.
Deno.test("TrailList.encode()", async () => {
  const expected = await Deno.readFile(
    path.fromFileUrl(import.meta.resolve("../../test_data/TrailList.expected")),
  );
  const trailList = new TrailList(trailService.trails.values());
  assertEquals(expected, trailList.encode().bytes());
});
