import { fastify, FastifyInstance } from "fastify";
import { pino, Logger } from 'pino';

import root from 'app-root-path';
import Config, { loadConfig } from "./config.js";
import Decorators from "./decorators.js";
import apiRoutes from './routes/api.js';
import DbService from "./services/db-service.js";
import TrailsService from "./services/trails-service.js";
import fastifyMultipart from "@fastify/multipart";
import ImageService from "./services/image-service.js";
import fastifyStatic from "@fastify/static";

const port = 3000;

class ForestParkServer {
  logger: Logger;
  server: FastifyInstance<never>;
  // server config
  config: Config
  // construct services
  trails = new TrailsService();
  images = new ImageService();
  database = new DbService();
  decorators = new Decorators();

  constructor() {
    this.logger = pino();
    this.server = fastify({logger: this.logger});
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
    this.server.register(fastifyStatic.default, {root: root.path});
  }
  async registerRoutes() {
    this.server.register(apiRoutes, {prefix: '/api/v1'});
  }
  // Runs the server blocking
  async run() {
    await this.server.listen({port, host: "0.0.0.0"});
  }
}

let server: ForestParkServer = null;
export default function Server() {
  if (server) {
    return server;
  }
  server = new ForestParkServer();
  return server;
}

await Server().initialize();
await Server().run();
