import { OpenAPIHono } from "@hono/zod-openapi";
import { v1 as uuidv1 } from "@std/uuid";
import * as decorators from "../decorator.ts";
import dbService from "../service/db_service.ts";
import trailsService from "../service/trails_service.ts";
import imageService from "../service/image_service.ts";
import { OkBinaryResponse } from "../util.ts";
import {
  getImageUuidRoute,
  hazardActiveRoute,
  hazardNewRoute,
  hazardUpdateRoute,
  hazardUuidRoute,
  putImageUuidRoute,
} from "../schema/hazard.ts";

const server = new OpenAPIHono()
  .openapi(hazardUpdateRoute, async (ctx) => {
    const update = {
      ...ctx.req.valid("json"),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated hazard actually exists
    if ((await dbService.fetchHazard(update.hazard)) == null) {
      return decorators.notFound(ctx);
    }
    await dbService.updateHazard(update);
    return ctx.json(update, 200);
  })
  .openapi(hazardNewRoute, async (ctx) => {
    const hazard = {
      ...ctx.req.valid("json"),
      uuid: uuidv1.generate(),
      time: new Date(),
    };
    // check that the associated trail actually exists
    if (!trailsService.trails.has(hazard.location.trail)) {
      return decorators.notFound(ctx);
    }
    await dbService.saveHazard(hazard);
    return ctx.json(hazard, 200);
  })
  .openapi(hazardActiveRoute, async (ctx) => {
    const hazards = await dbService.fetchHazards(true);
    return ctx.json(hazards, 200);
  })
  .openapi(putImageUuidRoute, async (ctx) => {
    const { uuid } = ctx.req.valid("param");
    const { file } = ctx.req.valid("form");
    if (await imageService.imageExists(uuid)) {
      return decorators.conflict(ctx, "Image already exists.");
    } else {
      await imageService.saveImage(file, uuid);
      return ctx.body(null, 200);
    }
  })
  .openapi(getImageUuidRoute, async (ctx) => {
    const uuid = ctx.req.param("uuid");
    if (!await imageService.imageExists(uuid)) {
      return decorators.notFound(
        ctx,
        `Could not find image with uuid '${uuid}'.`,
      );
    }
    const reader = await imageService.getImage(uuid);
    ctx.header("Content-Type", "image/jpeg");
    return ctx.body(reader, 200) as unknown as OkBinaryResponse;
  })
  .openapi(hazardUuidRoute, async (ctx) => {
    const { uuid } = ctx.req.valid("param");
    const updates = await dbService.fetchHazardUpdates(uuid);
    if (updates.length == 0) {
      return decorators.notFound(ctx);
    }
    return ctx.json(updates, 200);
  });

export default server;
