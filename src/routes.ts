import { Context, Hono } from "hono";
import trail from "./routes/trail.ts";
import hazard from "./routes/hazard.ts";

const app = new Hono()
  .get("/ping", (ctx: Context) => ctx.text(`Pong!`))
  .route("/trail", trail)
  .route("/hazard", hazard);

export default app;
