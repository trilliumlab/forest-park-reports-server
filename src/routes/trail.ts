import { Context, Hono } from "hono";
import Server from "../server.ts";
import { TrailList } from "../services/trails_service.ts";
import logger from "../logger.ts";
import * as decorators from "../decorators.ts";

const app = new Hono()
  .get("/list", (ctx: Context) => {
    return ctx.json(Array.from(Server().trails.trails.keys()));
  })
  .get("/all", (ctx: Context) => {
    const trailList = new TrailList(Server().trails.trails.values());
    return ctx.body(trailList.encode().bytes());
  })
  .get("/relations", (ctx: Context) => {
    return ctx.json(Array.from(Server().trails.relations.values()));
  })
  .get("/:id", (ctx: Context) => {
    const id = +ctx.req.param("id");
    logger.debug(`Got request with ${id}`);
    const trail = Server().trails.trails.get(id);
    if (trail) {
      return ctx.body(trail.encode().bytes());
    } else {
      return decorators.notFound(ctx);
    }
  });

export default app;
