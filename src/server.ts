import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import config from "./config.ts";
import { notFound } from "./decorator.ts";
import routes from "./route.ts";

export const server = new OpenAPIHono()
  .doc31("/openapi", {
    openapi: "3.1.0",
    info: {
      version: "0.1.0",
      title: "Trail Eyes Server Api",
    },
  })
  .get("/docs", swaggerUI({ url: config.swagger.schemaUrl }))
  .route("/", routes)
  .notFound(notFound);

if (import.meta.main) {
  Deno.serve({
    port: config.http.port,
    hostname: config.http.host,
    handler: server.fetch,
  });
}
