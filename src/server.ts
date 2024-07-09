import { fastify, FastifyInstance } from "fastify";
import * as log from '@std/log';
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";

import Config, { loadConfig } from "./config.ts";
import Decorators from "./decorators.ts";
import apiRoutes from './routes/api.ts';
import DbService from "./services/db-service.ts";
import TrailsService from "./services/trails-service.ts";
import ImageService from "./services/image-service.ts";

const rootDir = import.meta.resolve("../").substring(7);

class ForestParkServer {
  logger: log.Logger;
  server: FastifyInstance<never>;
  // server config
  config!: Config;
  // construct services
  trails = new TrailsService();
  images = new ImageService();
  database = new DbService();
  decorators = new Decorators();

  constructor() {
    log.setup({})
    // HACK: fastify uses pino under the hood, so we need to add missing methods
    this.logger = log.getLogger();
    log.Logger.prototype.trace = log.Logger.prototype.debug;
    log.Logger.prototype.fatal = log.Logger.prototype.critical;
    log.Logger.prototype.child = () => this.logger;

    this.server = fastify({
      logger: this.logger,
    });
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
    await this.registerRoutes();
  }
  async initServices() {
    // initialize the database service first as other services may use the database
    await this.database.init();
    await this.trails.init();
    await this.images.init();
  }
  async registerMiddleware() {
    this.server.register(fastifyMultipart.default);
    this.server.register(fastifyStatic.default, {root: rootDir});
  }
  async registerRoutes() {
    this.server.register(apiRoutes, {prefix: '/'});
  }
  // Runs the server blocking
  async run() {
    await this.server.listen({port: this.config.http.port, host: this.config.http.host});
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
await Server().run();
