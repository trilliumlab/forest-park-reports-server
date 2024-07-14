import { Context, Hono } from "hono";
import { TrailList } from "../service/trails_service.ts";
import logger from "../logger.ts";
import * as decorators from "../decorator.ts";
import trailsService from "../service/trails_service.ts";

const app = new Hono()
  .get("/list", (ctx: Context) => {
    return ctx.json(Array.from(trailsService.trails.keys()));
  })
  .get("/all", (ctx: Context) => {
    const trailList = new TrailList(trailsService.trails.values());
    return ctx.body(trailList.encode().bytes());
  })
  .get("/relations", (ctx: Context) => {
    return ctx.json(Array.from(trailsService.relations.values()));
  })
  .get("/:id", (ctx: Context) => {
    const id = +ctx.req.param("id");
    logger.debug(`Got request with ${id}`);
    const trail = trailsService.trails.get(id);
    if (trail) {
      return ctx.body(trail.encode().bytes());
    } else {
      return decorators.notFound(ctx);
    }
  });

export default app;
