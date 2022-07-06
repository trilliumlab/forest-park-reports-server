import root from 'app-root-path';
import path from "path";
import fs from 'fs-extra';

const configFile = path.join(root.path, "config.json");

export default interface Config {
  database: {
    url: string,
    maxConnections: number
  },
  trails: {
    reloadInterval: number
  }
}

export async function loadConfig(): Promise<Config> {
  return JSON.parse(await fs.readFile(configFile, 'utf-8'));
}
