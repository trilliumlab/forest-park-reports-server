import { Context, Hono } from "hono";
import trail from "./route/trail.ts";
import hazard from "./route/hazard.ts";

const routes = new Hono()
  .get("/ping", (ctx: Context) => ctx.text(`Pong!`))
  .route("/trail", trail)
  .route("/hazard", hazard);

export default routes;
