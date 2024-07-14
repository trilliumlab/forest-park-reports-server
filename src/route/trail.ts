import { OpenAPIHono } from "@hono/zod-openapi";
import { TrailList } from "../service/trails_service.ts";
import logger from "../logger.ts";
import * as decorators from "../decorator.ts";
import trailsService from "../service/trails_service.ts";

const routes = new OpenAPIHono()
  .get("/list", (ctx) => {
    return ctx.json(Array.from(trailsService.trails.keys()));
  })
  .get("/all", (ctx) => {
    const trailList = new TrailList(trailsService.trails.values());
    return ctx.body(trailList.encode().bytes());
  })
  .get("/relations", (ctx) => {
    return ctx.json(Array.from(trailsService.relations.values()));
  })
  .get("/:id", (ctx) => {
    const id = +ctx.req.param("id");
    logger.debug(`Got request with ${id}`);
    const trail = trailsService.trails.get(id);
    if (trail) {
      return ctx.body(trail.encode().bytes());
    } else {
      return decorators.notFound(ctx);
    }
  });

export default routes;
