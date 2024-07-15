import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { apiReference } from "@scalar/hono-api-reference";
import { normalize } from "@std/path";
import config from "./config.ts";
import { notFound } from "./decorator.ts";
import routes from "./route.ts";
import { scalarFixBackgroundCss } from "./const.ts";

export const server = new OpenAPIHono()
  .doc31("/openapi", {
    openapi: "3.1.0",
    info: {
      version: "0.1.0",
      title: "Trail Eyes Server Api",
    },
    servers: config.openapi.servers.map((url) => ({ url })),
  })
  .use("/*", cors())
  .get(
    "/docs",
    apiReference({
      pageTitle: "Trail Eyes API Reference",
      theme: "kepler",
      customCss: scalarFixBackgroundCss,
      spec: {
        url: normalize(`${config.http.baseUrl}/openapi`),
      },
    }),
  )
  .route("/", routes)
  .notFound(notFound);

if (import.meta.main) {
  Deno.serve({
    port: config.http.port,
    hostname: config.http.host,
    handler: server.fetch,
  });
}
