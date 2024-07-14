import { createRoute, z } from "@hono/zod-openapi";
import { ErrorSchema } from "../decorator.ts";

export const TrailListSchema = z.number().array().openapi({
  example: [105407026, 105407029, 105407044],
});

export const trailListRoute = createRoute({
  summary: "Gets all trail IDs",
  method: "get",
  path: "/list",
  responses: {
    200: {
      description: "List of trail IDs",
      content: {
        "application/json": {
          schema: TrailListSchema,
        },
      },
    },
  },
});

export const TrailAllSchema = z.instanceof(Uint8Array).openapi({
  format: "binary",
  example: new Uint8Array(),
});

export const trailAllRoute = createRoute({
  summary: "Gets all trails",
  method: "get",
  path: "/all",
  responses: {
    200: {
      description: "Binary encoded list of trails",
      content: {
        "application/octet-stream": {
          schema: TrailAllSchema,
        },
      },
    },
  },
});

export const TrailRelationsSchema = z.array(
  z.object({
    type: z.enum(["relation"]),
    id: z.number(),
    tags: z.record(z.string(), z.string()),
    members: z.number().array(),
  }),
).openapi({
  example: [{
    "type": "relation",
    "id": 84,
    "tags": {
      "RLIS:systemname": "Forest Park Trails",
      "access": "yes",
      "bicycle": "designated",
      "foot": "designated",
      "highway": "path",
      "motor_vehicle": "no",
      "mtb:scale": "1",
      "name": "Northwest Firelane 1 Road",
      "surface": "dirt",
    },
    "members": [
      113897058,
      113897247,
    ],
  }],
});

export type Relation = z.infer<typeof TrailRelationsSchema.element>;

export const trailRelationsRoute = createRoute({
  summary: "Gets all relations",
  method: "get",
  path: "/relations",
  responses: {
    200: {
      description: "List of relations",
      content: {
        "application/json": {
          schema: TrailRelationsSchema,
        },
      },
    },
  },
});

export const TrailIdParamsSchema = z.object({
  id: z.coerce.number().openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: 113897295,
  }),
});

export const TrailIdSchema = z.instanceof(Uint8Array).openapi({
  format: "binary",
  example: new Uint8Array(),
});

export const trailIdRoute = createRoute({
  summary: "Gets a trail by ID",
  method: "get",
  path: "/{id}",
  request: {
    params: TrailIdParamsSchema,
  },
  responses: {
    200: {
      description: "Binary encoded trail",
      content: {
        "application/octet-stream": {
          schema: TrailIdSchema,
        },
      },
    },
    404: {
      description: "Trail with given ID not found",
      content: {
        "application/json": {
          schema: ErrorSchema.openapi({
            example: {
              code: 404,
              error: "Resource Not Found",
            },
          }),
        },
      },
    },
  },
});
