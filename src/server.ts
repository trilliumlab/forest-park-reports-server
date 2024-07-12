import { Hono } from "hono";
import * as log from "@std/log";
import { config } from "./config.ts";
import Decorators from "./decorators.ts";
import apiRoutes from "./routes/api.ts";
import DbService from "./services/db_service.ts";
import Trails_service from "./services/trails_service.ts";
import ImageService from "./services/image_service.ts";

class ForestParkServer {
  logger: log.Logger;
  server: Hono;
  // construct services
  trails = new Trails_service();
  images = new ImageService();
  database = new DbService();
  decorators = new Decorators();

  constructor() {
    log.setup({});
    this.logger = log.getLogger();
    this.server = new Hono();
  }
  // This is where we run any async code that needs
  // to be run before the http server can be started
  async initialize() {
    // starts all services
    await this.initServices();
    // registers middleware
    await this.registerMiddleware();
    // routes and decorators can depend on service initialization and are registered at the end.
    this.decorators.register(this.server);
    this.registerRoutes();
  }
  async initServices() {
    // initialize the database service first as other services may use the database
    await this.database.init();
    await this.trails.init();
    await this.images.init();
  }
  async registerMiddleware() {
    // this.server.register(fastifyMultipart.default);
    // this.server.register(fastifyStatic.default, {root: rootDir});
  }
  registerRoutes() {
    this.server.route("/", apiRoutes());
  }
  // Runs the server blocking
  run() {
    Deno.serve({
      port: config.http.port,
      hostname: config.http.host,
      handler: this.server.fetch,
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
Server().run();
