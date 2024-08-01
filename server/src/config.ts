import { parse } from "@std/jsonc";
import * as path from "@std/path";
import { ErrorBase } from "./util.ts";
import { z } from "@hono/zod-openapi";
import { validHostnameRegex } from "./const.ts";

export const ConfigSchema = z.object({
  http: z.object({
    host: z.string().regex(validHostnameRegex, "host must be a valid hostname"),
    port: z.number().gte(1).lte(65535),
    baseUrl: z.string().default("/"),
  }),
  openapi: z.object({
    servers: z.array(z.string()).default([]),
  }),
  database: z.object({
    maxConnections: z.number().default(10),
    applicationName: z.string().nullish(),
    host: z.string().regex(validHostnameRegex, "host must be a valid hostname"),
    port: z.number().gte(1).lte(65535).default(5432),
    user: z.string(),
    password: z.string(),
    database: z.string(),
    ssl: z.boolean().default(false),
  }),
  images: z.object({
    cleanInterval: z.number().positive(),
  }),
});

export class MissingConfigFileError extends ErrorBase {}
export class InvalidConfigError extends ErrorBase {}

async function loadConfig() {
  const configPath = path.fromFileUrl(import.meta.resolve(
    Deno.env.get("DENO_TEST") === "1"
      ? "../config.test.jsonc"
      : "../config.jsonc",
  ));
  try {
    return await ConfigSchema.parseAsync(
      parse(await Deno.readTextFile(configPath)),
    );
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log(e.name);
      throw new MissingConfigFileError(e.message);
    } else if (e instanceof z.ZodError) {
      throw new InvalidConfigError(e.message);
    } else {
      throw e;
    }
  }
}
export default await loadConfig();
