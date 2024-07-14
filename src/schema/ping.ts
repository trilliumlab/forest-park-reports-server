import { createRoute, z } from "@hono/zod-openapi";

const PingSchema = z.string().openapi({
  example: "Pong!",
});

export const pingRoute = createRoute({
  description: "Ping the server.",
  method: "get",
  path: "/ping",
  responses: {
    200: {
      content: {
        "application/text": {
          schema: PingSchema,
        },
      },
      description: "Server online.",
    },
  },
});
