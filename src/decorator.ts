import { Context } from "hono";
import { z } from "@hono/zod-openapi";

export interface ErrorResponse {
  code: number;
  error: string;
  message?: string;
}

export const ErrorSchema = z.object({
  code: z.number(),
  error: z.string(),
  message: z.string().nullish(),
});

export const NotFoundSchema = ErrorSchema.extend({
  code: z.literal(404),
  error: z.literal("Resource Not Found"),
});
export function notFound(ctx: Context, message?: string) {
  return ctx.json({
    code: NotFoundSchema.shape.code.value,
    error: NotFoundSchema.shape.error.value,
    message,
  }, NotFoundSchema.shape.code.value);
}

export const BadRequestSchema = ErrorSchema.extend({
  code: z.literal(400),
  error: z.literal("Bad Request"),
});
export function badRequest(ctx: Context, message?: string) {
  return ctx.json({
    code: BadRequestSchema.shape.code.value,
    error: BadRequestSchema.shape.error.value,
    message,
  }, BadRequestSchema.shape.code.value);
}

export const ConflictSchema = ErrorSchema.extend({
  code: z.literal(409),
  error: z.literal("Conflict"),
});
export function conflict(ctx: Context, message?: string) {
  return ctx.json({
    code: ConflictSchema.shape.code.value,
    error: ConflictSchema.shape.error.value,
    message,
  }, ConflictSchema.shape.code.value);
}
