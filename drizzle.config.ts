import { defineConfig } from "drizzle-kit";
import JSONC from "jsonc-simple-parser";

function getCredentials() {
  const conf = JSONC.parse(Deno.readTextFileSync("./config.jsonc")).database;
  conf.ssl = false;
  return conf;
}

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Using jsonc-simple-parser for now as non-npm modules fail to import when running through npm
  dbCredentials: getCredentials(),
  verbose: true,
});
