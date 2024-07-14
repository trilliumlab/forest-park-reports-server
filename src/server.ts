import { Hono } from "hono";
import config from "./config.ts";
import * as decorators from "./decorators.ts";
import routes from "./routes.ts";

const server = new Hono().route("/", routes);
decorators.register(server);
export default server;

if (import.meta.main) {
  Deno.serve({
    port: config.http.port,
    hostname: config.http.host,
    handler: server.fetch,
  });
}
