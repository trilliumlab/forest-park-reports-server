import { Hono } from "hono";
import * as log from '@std/log';
import Config, { loadConfig } from "./config.ts";
import Decorators from "./decorators.ts";
import apiRoutes from './routes/api.ts';
import DbService from "./services/db-service.ts";
import TrailsService from "./services/trails-service.ts";
import ImageService from "./services/image-service.ts";

class ForestParkServer {
  logger: log.Logger;
  server: Hono;
  // server config
  config!: Config;
  // construct services
  trails = new TrailsService();
  images = new ImageService();
  database = new DbService();
  decorators = new Decorators();

  constructor() {
    log.setup({})
    this.logger = log.getLogger();
    this.server = new Hono();
  }
  // This is where we run any async code that needs
  // to be run before the http server can be started
  async initialize() {
    // load config before initializing services, services rely on config
    this.config = await loadConfig();
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
    this.server.route('/', apiRoutes());
  }
  // Runs the server blocking
  run() {
    Deno.serve({
      port: this.config.http.port,
      hostname: this.config.http.host,
      handler: this.server.fetch
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
