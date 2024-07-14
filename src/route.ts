import { OpenAPIHono } from "@hono/zod-openapi";
import { pingRoute } from "./schema/ping.ts";
import trail from "./route/trail.ts";
import hazard from "./route/hazard.ts";

const routes = new OpenAPIHono()
  .openapi(pingRoute, (ctx) => ctx.text(`Pong!`))
  .route("/trail", trail)
  .route("/hazard", hazard);

export default routes;
