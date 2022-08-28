import root from 'app-root-path';
import path from "path";
import fs from 'fs-extra';

const configFile = path.join(root.path, "config.json");

export default interface Config {
  http: {
    host: string,
    port: number,
  },
  database: {
    url: string,
    maxConnections: number
  },
  trails: {
    reloadInterval: number
  },
  images: {
    cleanInterval: number
  },
}

export async function loadConfig(): Promise<Config> {
  return JSON.parse(await fs.readFile(configFile, 'utf-8'));
}
