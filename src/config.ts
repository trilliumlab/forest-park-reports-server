import { parse } from "@std/jsonc";

const configPath = import.meta.resolve("../config.jsonc").substring(7);

export default interface Config {
  http: {
    host: string;
    port: number;
  };
  database: {
    maxConnections: number;
    database: string;
    hostname: string;
    password: string;
    port: number;
    user: string;
    applicationName?: string;
    connection?: {
      attempts?: number;
      interval?: number;
    };
    tls?: {
      enable?: boolean;
      enforce?: boolean;
    };
  };
  images: {
    cleanInterval: number;
  };
}

export async function loadConfig(): Promise<Config> {
  return parse(await Deno.readTextFile(configPath));
}
