import { TypedResponse } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { TrailList } from "../service/trails_service.ts";
import logger from "../logger.ts";
import * as decorators from "../decorator.ts";
import trailsService from "../service/trails_service.ts";
import {
  trailAllRoute,
  trailIdRoute,
  trailListRoute,
  trailRelationsRoute,
} from "../schema/trail.ts";

type OkBinaryResponse = TypedResponse<Uint8Array, 200, string>;

const routes = new OpenAPIHono()
  .openapi(trailListRoute, (ctx) => {
    return ctx.json(Array.from(trailsService.trails.keys()));
  })
  .openapi(trailAllRoute, (ctx) => {
    const trailList = new TrailList(trailsService.trails.values());
    ctx.header("Content-Type", "application/octet-stream");
    return ctx.body(trailList.encode().bytes()) as unknown as OkBinaryResponse;
  })
  .openapi(trailRelationsRoute, (ctx) => {
    return ctx.json(Array.from(trailsService.relations.values()));
  })
  .openapi(trailIdRoute, (ctx) => {
    const { id } = ctx.req.valid("param");
    logger.debug(`Got request with ${id}`);
    const trail = trailsService.trails.get(id);
    if (trail) {
      ctx.header("Content-Type", "application/octet-stream");
      return ctx.body(trail.encode().bytes()) as unknown as OkBinaryResponse;
    } else {
      return decorators.notFound(ctx);
    }
  });

export default routes;
