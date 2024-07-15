import { createRoute, z } from "@hono/zod-openapi";

export const PingSchema = z.literal("Pong!");

export const pingRoute = createRoute({
  summary: "Ping the server",
  description:
    "Ping the server to ensure it is running. This will always return `Pong!` when the server is online.",
  tags: ["status"],
  method: "get",
  path: "/ping",
  responses: {
    200: {
      content: {
        "application/text": {
          schema: PingSchema,
        },
      },
      description: "Server online",
    },
  },
});
