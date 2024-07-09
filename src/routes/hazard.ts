import { Context, Hono } from "hono";
import { Hazard, HazardUpdate } from "../models/hazard.ts";
import { v1 as uuidv1 } from "@std/uuid";
import Server from "../server.ts";

// array extensions
declare global {
  interface Array<T> {
    forEachParallel(
      this: Array<T>,
      func: (item: T) => Promise<void>,
    ): Promise<void>;
  }
}
Object.defineProperty(Array.prototype, "forEachParallel", {
  value: async function <T>(
    this: Array<T>,
    func: (item: T) => Promise<void>,
  ): Promise<void> {
    // TypeScript now correctly infers the result from this.map
    await Promise.all(this.map((item) => func(item)));
  },
});

function hazardRoutes() {
  const hazardGroup = new Hono();
  hazardGroup.post("/update", async (ctx: Context) => {
    const update: HazardUpdate = {
      ...await ctx.req.json(),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated hazard actually exists
    if ((await Server().database.fetchHazard(update.hazard)) == null) {
      return Server().decorators.notFound(ctx);
    }
    await Server().database.updateHazard(update);
    return ctx.json(update);
  });
  hazardGroup.post("/new", async (ctx: Context) => {
    const hazard: Hazard = {
      ...await ctx.req.json(),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated trail actually exists
    if (!Server().trails.trails[hazard.location.trail]) {
      return Server().decorators.notFound(ctx);
    }
    await Server().database.saveHazard(hazard);
    return ctx.json(hazard);
  });
  hazardGroup.get("/active", async (ctx: Context) => {
    const hazards = await Server().database.fetchHazards(true);
    await hazards.forEachParallel(async (hazard) => {
      if (hazard.image) {
        if (!await Server().images.imageExists(hazard.image)) {
          hazard.image = undefined;
        }
      }
    });
    return ctx.json(hazards);
  });
  hazardGroup.put("/image/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    const body = await ctx.req.parseBody();
    const data = body.file;
    if (!(data instanceof File)) {
      return Server().decorators.badRequest(
        ctx,
        "multipart/form-data included file must be a File.",
      );
    }
    if (await Server().images.imageExists(uuid)) {
      return Server().decorators.conflict(ctx, "Image already exists.");
    } else {
      await Server().images.saveImage(data, uuid);
    }
  });
  hazardGroup.get("/image/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    const reader = await Server().images.getImage(uuid);
    return ctx.body(reader);
  });
  hazardGroup.get("/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    if (!uuidv1.validate(uuid)) {
      return Server().decorators.badRequest(ctx, "Invalid UUID");
    }
    const updates = await Server().database.fetchHazardUpdates(uuid);
    if (updates.length == 0) {
      return Server().decorators.notFound(ctx);
    }
    return ctx.json(updates);
  });
  return hazardGroup;
}

export default hazardRoutes;
