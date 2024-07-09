import { Context, Hono } from "hono";

export default class Decorators {
  register(server: Hono) {
    server.notFound(this.notFound);
  }
  notFound(ctx: Context) {
    return ctx.json({ code: 404, error: "Resource Not Found" }, 404);
  }
  badRequest(ctx: Context, message?: string) {
    return ctx.json({ code: 400, error: message ?? "Bad Request" }, 400);
  }
  conflict(ctx: Context, message?: string) {
    return ctx.json({ code: 409, error: message ?? "Conflict" }, 409);
  }
}
