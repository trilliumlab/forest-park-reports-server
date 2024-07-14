import { Context, Hono } from "hono";
import { Hazard, HazardUpdate } from "../model/hazard.ts";
import { v1 as uuidv1 } from "@std/uuid";
import * as decorators from "../decorator.ts";
import dbService from "../service/db_service.ts";
import trailsService from "../service/trails_service.ts";
import imageService from "../service/image_service.ts";

const app = new Hono()
  .post("/update", async (ctx: Context) => {
    const update: HazardUpdate = {
      ...await ctx.req.json(),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated hazard actually exists
    if ((await dbService.fetchHazard(update.hazard)) == null) {
      return decorators.notFound(ctx);
    }
    await dbService.updateHazard(update);
    return ctx.json(update);
  })
  .post("/new", async (ctx: Context) => {
    const hazard: Hazard = {
      ...await ctx.req.json(),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated trail actually exists
    if (!trailsService.trails.has(hazard.location.trail)) {
      return decorators.notFound(ctx);
    }
    await dbService.saveHazard(hazard);
    return ctx.json(hazard);
  })
  .get("/active", async (ctx: Context) => {
    const hazards = await dbService.fetchHazards(true);
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
    if (await imageService.imageExists(uuid)) {
      return decorators.conflict(ctx, "Image already exists.");
    } else {
      await imageService.saveImage(data, uuid);
    }
  })
  .get("/image/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    if (!await imageService.imageExists(uuid)) {
      return decorators.notFound(
        ctx,
        `Could not find image with uuid '${uuid}'.`,
      );
    }
    const reader = await imageService.getImage(uuid);
    return ctx.body(reader);
  })
  .get("/:uuid", async (ctx: Context) => {
    const uuid = ctx.req.param("uuid");
    if (!uuidv1.validate(uuid)) {
      return decorators.badRequest(ctx, "Invalid UUID");
    }
    const updates = await dbService.fetchHazardUpdates(uuid);
    if (updates.length == 0) {
      return decorators.notFound(ctx);
    }
    return ctx.json(updates);
  });

export default app;
