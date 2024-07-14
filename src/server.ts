import { Hono } from "hono";
import config from "./config.ts";
import * as decorators from "./decorators.ts";
import routes from "./routes.ts";
import DbService from "./services/db_service.ts";
import TrailsService from "./services/trails_service.ts";
import ImageService from "./services/image_service.ts";

export const app = new Hono().route("/", routes);
decorators.register(app);

class ForestParkServer {
  // construct services
  trails = new TrailsService();
  images = new ImageService();
  database = new DbService();

  // This is where we run any async code that needs
  // to be run before the http server can be started
  async initialize() {
    // starts all services
    await this.initServices();
  }
  async initServices() {
    // initialize the database service first as other services may use the database
    await this.database.init();
    await this.trails.init();
    await this.images.init();
  }
}

let fpServer: ForestParkServer | null;
export function Server() {
  if (fpServer) {
    return fpServer;
  }
  fpServer = new ForestParkServer();
  return fpServer;
}

await Server().initialize();
if (import.meta.main) {
  Deno.serve({
    port: config.http.port,
    hostname: config.http.host,
    handler: app.fetch,
  });
}
