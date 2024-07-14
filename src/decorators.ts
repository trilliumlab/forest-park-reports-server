import { Context } from "hono";

export interface ErrorResponse {
  code: number;
  error: string;
  message?: string;
}

export function notFound(ctx: Context, message?: string) {
  return ctx.json({ code: 404, error: "Resource Not Found", message }, 404);
}
export function badRequest(ctx: Context, message?: string) {
  return ctx.json({ code: 400, error: "Bad Request", message }, 400);
}
export function conflict(ctx: Context, message?: string) {
  return ctx.json({ code: 409, error: "Conflict", message }, 409);
}
