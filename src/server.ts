import { fastify, FastifyInstance } from "fastify";
import { pino, Logger } from 'pino';

import Config, { loadConfig } from "./config.js";
import Decorators from "./decorators.js";
import apiRoutes from './routes/api.js';
import DbService from "./services/db-service.js";
import TrailsService from "./services/trails-service.js";

const port = 3000;

class ForestParkServer {
  logger: Logger;
  server: FastifyInstance<any>;
  // server config
  config: Config
  // construct services
  trails = new TrailsService();
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
    // routes and decorators can depend on service initialization and are registered at the end.
    this.decorators.register(this.server);
    await this.registerRoutes();
  }
  async initServices() {
    // intialize the database service first as other services may use the database
    await this.database.init();
    await this.trails.init();
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
