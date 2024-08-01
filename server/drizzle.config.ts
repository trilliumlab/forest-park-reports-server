import { defineConfig } from "drizzle-kit";
import JSONC from "jsonc-simple-parser";

const dbConfig = JSONC.parse(Deno.readTextFileSync("./config.jsonc")).database;

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: `./drizzle/${dbConfig.database}`,
  dialect: "postgresql",
  // Using jsonc-simple-parser for now as non-npm modules fail to import when running through npm
  dbCredentials: dbConfig,
  verbose: true,
});
