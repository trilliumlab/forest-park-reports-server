import { Context, Hono } from "hono";
import { Hazard, HazardUpdate } from "../models/hazard.ts";
import { v1 as uuidv1 } from "@std/uuid";
import { Server } from "../server.ts";
import * as decorators from "../decorators.ts";

const app = new Hono()
  .post("/update", async (ctx: Context) => {
    const update: HazardUpdate = {
      ...await ctx.req.json(),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated hazard actually exists
    if ((await Server().database.fetchHazard(update.hazard)) == null) {
      return decorators.notFound(ctx);
    }
    await Server().database.updateHazard(update);
    return ctx.json(update);
  })
  .post("/new", async (ctx: Context) => {
    const hazard: Hazard = {
      ...await ctx.req.json(),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated trail actually exists
    if (!Server().trails.trails.has(hazard.location.trail)) {
      return decorators.notFound(ctx);
    }
    await Server().database.saveHazard(hazard);
    return ctx.json(hazard);
  })
  .get("/active", async (ctx: Context) => {
    const hazards = await Server().database.fetchHazards(true);
    return ctx.json(hazards);
  })
  .put("/image/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    const body = await ctx.req.parseBody();
    const data = body.file;
    if (!(data instanceof File)) {
      return decorators.badRequest(
        ctx,
        "multipart/form-data included file must be a File.",
      );
    }
    if (await Server().images.imageExists(uuid)) {
      return decorators.conflict(ctx, "Image already exists.");
    } else {
      await Server().images.saveImage(data, uuid);
    }
  })
  .get("/image/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    if (!await Server().images.imageExists(uuid)) {
      return decorators.notFound(
        ctx,
        `Could not find image with uuid '${uuid}'.`,
      );
    }
    const reader = await Server().images.getImage(uuid);
    return ctx.body(reader);
  })
  .get("/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    if (!uuidv1.validate(uuid)) {
      return decorators.badRequest(ctx, "Invalid UUID");
    }
    const updates = await Server().database.fetchHazardUpdates(uuid);
    if (updates.length == 0) {
      return decorators.notFound(ctx);
    }
    return ctx.json(updates);
  });

export default app;
