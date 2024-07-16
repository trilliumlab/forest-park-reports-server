import { createRoute, z } from "@hono/zod-openapi";
import { ConflictSchema, NotFoundSchema } from "../decorator.ts";
import { hazardTypeEnum } from "../database/schema.ts";

export const HazardUpdateSchema = z.object({
  hazard: z.string().uuid(),
  active: z.boolean(),
  uuid: z.string().uuid(),
  time: z.coerce.date(),
  blurHash: z.string().nullish(),
  image: z.string().uuid().nullish(),
  offline: z.boolean().default(false),
});

export type HazardUpdate = z.infer<typeof HazardUpdateSchema>;

export const hazardUpdateRoute = createRoute({
  summary: "Creates a new hazard update",
  tags: ["hazard"],
  method: "post",
  path: "/update",
  request: {
    body: {
      content: {
        "application/json": {
          schema: HazardUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "The created hazard update",
      content: {
        "application/json": {
          schema: HazardUpdateSchema,
        },
      },
    },
    404: {
      description: "Hazard with given uuid not found",
      content: {
        "application/json": {
          schema: NotFoundSchema,
        },
      },
    },
  },
});

export const HazardNewBodySchema = z.object({
  hazard: z.enum(hazardTypeEnum.enumValues),
  location: z.object({
    trail: z.number().int().nonnegative(),
    node: z.number().int().nonnegative(),
    lat: z.number(),
    long: z.number(),
  }),
  uuid: z.string().uuid(),
  time: z.coerce.date(),
  blurHash: z.string().nullish(),
  image: z.string().uuid().nullish(),
  offline: z.boolean().default(false),
});

export type Hazard = z.infer<typeof HazardNewBodySchema>;

export const HazardNewSchema = z.object({
  hazard: HazardNewBodySchema,
  updates: HazardUpdateSchema.array(),
});

export const hazardNewRoute = createRoute({
  summary: "Creates a new hazard",
  tags: ["hazard"],
  method: "post",
  path: "/new",
  request: {
    body: {
      content: {
        "application/json": {
          schema: HazardNewBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "The created hazard",
      content: {
        "application/json": {
          schema: HazardNewSchema,
        },
      },
    },
    404: {
      description: "Trail with given ID not found",
      content: {
        "application/json": {
          schema: NotFoundSchema,
        },
      },
    },
    409: {
      description: "Hazard with given uuid already exists",
      content: {
        "application/json": {
          schema: ConflictSchema,
        },
      },
    },
  },
});

export const HazardActiveSchema = HazardNewBodySchema.array();

export const hazardActiveRoute = createRoute({
  summary: "Get all active hazards",
  tags: ["hazard"],
  method: "get",
  path: "/active",
  responses: {
    200: {
      description: "List of active hazards",
      content: {
        "application/json": {
          schema: HazardActiveSchema,
        },
      },
    },
  },
});

export const UuidParamsSchema = z.object({
  uuid: z.string().uuid().openapi({
    param: {
      name: "uuid",
      in: "path",
    },
    example: "93d20696-42ba-11ef-9454-0242ac120002",
  }),
});

export const PutImageUuidBodySchema = z.object({
  file: z.instanceof(File).openapi({
    format: "binary",
    description: "The image to upload, jpeg encoded",
  }),
});

export const putImageUuidRoute = createRoute({
  summary: "Uploads a hazard image",
  tags: ["hazard"],
  method: "put",
  path: "/image/{uuid}",
  request: {
    params: UuidParamsSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: PutImageUuidBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Image upload success",
    },
    409: {
      description: "Image already exists",
      content: {
        "application/json": {
          schema: ConflictSchema,
        },
      },
    },
  },
});

export const GetImageUuidSchema = z.instanceof(Uint8Array).openapi({
  format: "binary",
  example: new Uint8Array(),
});

export const getImageUuidRoute = createRoute({
  summary: "Gets a hazard image",
  tags: ["hazard"],
  method: "get",
  path: "/image/{uuid}",
  request: {
    params: UuidParamsSchema,
  },
  responses: {
    200: {
      description: "Image upload success",
      content: {
        "image/jpeg": {
          schema: GetImageUuidSchema,
        },
      },
    },
    404: {
      description: "Image not found",
      content: {
        "application/json": {
          schema: NotFoundSchema,
        },
      },
    },
  },
});

export const hazardUuidRoute = createRoute({
  summary: "Gets updates for a given hazard",
  tags: ["hazard"],
  method: "get",
  path: "/{uuid}",
  request: {
    params: UuidParamsSchema,
  },
  responses: {
    200: {
      description: "The hazard updates",
      content: {
        "application/json": {
          schema: HazardUpdateSchema.array(),
        },
      },
    },
    404: {
      description: "Hazard with given uuid not found",
      content: {
        "application/json": {
          schema: NotFoundSchema,
        },
      },
    },
  },
});
