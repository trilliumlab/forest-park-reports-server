import { Hono } from "hono";
import config from "./config.ts";
import * as decorators from "./decorators.ts";
import routes from "./routes.ts";

export const app = new Hono().route("/", routes);
decorators.register(app);

if (import.meta.main) {
  Deno.serve({
    port: config.http.port,
    hostname: config.http.host,
    handler: app.fetch,
  });
}
