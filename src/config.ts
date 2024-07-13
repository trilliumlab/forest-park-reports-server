import { parse } from "@std/jsonc";
import * as path from "@std/path";

const configPath = path.fromFileUrl(import.meta.resolve("../config.jsonc"));

export default interface TrailEyesConfig {
  http: {
    host: string;
    port: number;
  };
  database: {
    maxConnections: number;
    applicationName?: string;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: boolean;
  };
  images: {
    cleanInterval: number;
  };
}

export function loadConfig(): TrailEyesConfig {
  return parse(Deno.readTextFileSync(configPath)) as unknown as TrailEyesConfig;
}

export const config = loadConfig();
