import { Context, Hono } from "hono";
import Server from "../server.ts";
import { TrailList } from "../services/trails-service.ts";

function trailRoutes() {
  const trailGroup = new Hono();
  trailGroup.get("/list", (ctx: Context) => {
    return ctx.json(Object.keys(Server().trails.trails).map((k) => Number(k)));
  });
  trailGroup.get("/all", (ctx: Context) => {
    const trailList = new TrailList(Object.values(Server().trails.trails));
    return ctx.body(trailList.encode().bytes());
  });
  trailGroup.get("/relations", (ctx: Context) => {
    return ctx.json(Object.values(Server().trails.relations));
  });
  trailGroup.get("/:id", (ctx: Context) => {
    const id = +ctx.req.param("id");
    Server().logger.debug(`Got request with ${id}`);
    if (id in Server().trails.trails) {
      return ctx.body(Server().trails.trails[id].encode().bytes());
    } else {
      return Server().decorators.notFound(ctx);
    }
  });
  return trailGroup;
}

export default trailRoutes;
