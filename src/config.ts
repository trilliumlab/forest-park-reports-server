import { parse } from "@std/jsonc";
import * as path from "@std/path";
import { ErrorBase } from "./util.ts";

export interface TrailEyesConfig {
  http: {
    host: string;
    port: number;
  };
  swagger: {
    schemaUrl: string;
  };
  database: {
    maxConnections?: number;
    applicationName?: string;
    host: string;
    port?: number;
    user: string;
    password: string;
    database: string;
    ssl?: boolean;
  };
  images: {
    cleanInterval: number;
  };
}

export class MissingConfigFileError extends ErrorBase {}

async function loadConfig(): Promise<TrailEyesConfig> {
  const configPath = path.fromFileUrl(import.meta.resolve(
    Deno.env.get("DENO_TEST") === "1"
      ? "../config.test.jsonc"
      : "../config.jsonc",
  ));
  try {
    const conf = parse(await Deno.readTextFile(configPath));
    return <TrailEyesConfig> <unknown> conf;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.log(e.name);
      throw new MissingConfigFileError(e.message);
    } else {
      throw e;
    }
  }
}
export default await loadConfig();
