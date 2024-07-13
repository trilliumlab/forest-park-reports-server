import { Hono } from "hono";
import * as log from "@std/log";
import config from "./config.ts";
import Decorators from "./decorators.ts";
import routes from "./routes.ts";
import DbService from "./services/db_service.ts";
import Trails_service from "./services/trails_service.ts";
import ImageService from "./services/image_service.ts";

class ForestParkServer {
  logger: log.Logger;
  app = new Hono().route("/", routes);
  // construct services
  trails = new Trails_service();
  images = new ImageService();
  database = new DbService();
  decorators = new Decorators();

  constructor() {
    log.setup({});
    this.logger = log.getLogger();
  }
  // This is where we run any async code that needs
  // to be run before the http server can be started
  async initialize() {
    // starts all services
    await this.initServices();
    // routes and decorators can depend on service initialization and are registered at the end.
    this.decorators.register(this.app);
  }
  async initServices() {
    // initialize the database service first as other services may use the database
    await this.database.init();
    await this.trails.init();
    await this.images.init();
  }
  // Runs the server blocking
  run() {
    Deno.serve({
      port: config.http.port,
      hostname: config.http.host,
      handler: this.app.fetch,
    });
  }
}

let server: ForestParkServer | null;
export default function Server() {
  if (server) {
    return server;
  }
  server = new ForestParkServer();
  return server;
}

await Server().initialize();
if (import.meta.main) {
  Server().run();
}
